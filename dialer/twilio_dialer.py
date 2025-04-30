import os
import random
import csv
import io
import json
from datetime import datetime, timedelta, date
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, request, jsonify, render_template, g
from twilio.rest import Client
import logging
import threading
import time
import schedule

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/twilio_dialer')

# Twilio credentials
account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
client = Client(account_sid, auth_token)

# Your list of Twilio phone numbers
twilio_numbers = [
    "+1XXXXXXXXXX",  # Replace with your Twilio numbers
    # Add all 20 numbers here
]

# Your Twilio TwiML URL for handling the call
twiml_url = "https://your-domain.com/twiml"  # Replace with your TwiML URL

# Database helper functions
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = psycopg2.connect(DATABASE_URL)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def create_connection():
    """Create a database connection outside of request context"""
    return psycopg2.connect(DATABASE_URL)

def init_db():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Create leads table with prioritization fields
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        phone_number TEXT UNIQUE,
        name TEXT,
        added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        priority TEXT DEFAULT 'normal',
        is_hot BOOLEAN DEFAULT FALSE,
        do_not_call BOOLEAN DEFAULT FALSE,
        follow_up_date DATE,
        last_call_attempt TIMESTAMP,
        call_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'new',
        importance TEXT DEFAULT 'normal',
        score INTEGER DEFAULT 100,
        last_contact_date TIMESTAMP,
        email TEXT,
        company TEXT,
        custom_fields JSONB,
        last_call_result TEXT,
        conversion_status TEXT DEFAULT 'new'
    )
    ''')
    
    # Create call_history table with notes field
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS call_history (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id),
        to_number TEXT,
        from_number TEXT,
        call_sid TEXT,
        status TEXT,
        call_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        duration INTEGER DEFAULT 0,
        notes TEXT,
        tags TEXT[],
        follow_up_date DATE,
        agent_name TEXT,
        call_result TEXT
    )
    ''')
    
    # Create lead_sequence table to track the follow-up sequence
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS lead_sequence (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id),
        sequence_step INTEGER DEFAULT 0,
        next_call_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        call_window_start TIME,
        call_window_end TIME
    )
    ''')
    
    # Create used_numbers table to track which Twilio numbers were used for which leads
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS used_numbers (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id),
        twilio_number TEXT,
        call_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create extension for pgvector (for future use)
    try:
        cursor.execute('CREATE EXTENSION IF NOT EXISTS vector')
    except Exception as e:
        logger.warning(f"Note: pgvector extension could not be created: {str(e)}")
    
    conn.commit()
    conn.close()

# Initialize database tables
try:
    init_db()
except Exception as e:
    logger.error(f"Database initialization error: {str(e)}")

# Lead prioritization functions
def calculate_lead_score(lead):
    """
    Calculate a numerical score for a lead to determine call priority
    Higher scores = higher priority
    
    This scoring system prioritizes:
    1. Hot leads
    2. New leads (based on upload date)
    3. Leads with scheduled follow-ups
    4. Leads with fewer call attempts within their time window
    """
    score = 100  # Base score
    now = datetime.now().date()
    
    # === HOT LEADS ===
    # Hot leads get highest priority, but calendar appointments within 2 days are even higher
    if lead['is_hot']:
        score += 2000
    
    # === FOLLOW-UP DATE HANDLING ===
    # If follow-up date is set and is today or past, highest priority
    if lead['follow_up_date']:
        days_until_followup = (lead['follow_up_date'] - now).days
        if days_until_followup <= 0:  # Today or overdue
            score += 3000  # Top priority
        elif days_until_followup <= 2:  # Within next 2 days
            score += 2500  # Higher than hot leads
        else:
            score -= 5000  # Future follow-up, don't call yet
    
    # === UPLOAD DATE PRIORITY ===
    # Fresh leads get higher priority - this is a major driver
    days_since_added = (now - lead['added_date'].date()).days if lead['added_date'] else 0
    
    # Very fresh leads (0-7 days) get highest non-hot priority
    if days_since_added <= 7:
        # Day 0 = 1500, Day 7 = 800 (decreases each day)
        recency_bonus = 1500 - (days_since_added * 100)
        score += recency_bonus
    elif days_since_added <= 14:
        # Week 2 leads get medium priority
        score += 700
    elif days_since_added <= 30:
        # Month 1 leads get lower priority
        score += 500
    elif days_since_added <= 90:
        # Older leads get progressively lower priority
        score += 300
    else:
        # Very old leads (>90 days) get lowest priority
        score += 100
    
    # === CALL ATTEMPT HANDLING ===
    # Factor in the number of attempts
    call_count = lead['call_count'] or 0
    
    # Uncalled leads get highest priority within their recency group
    if call_count == 0:
        score += 1000  # Big bonus for never-called leads
    elif call_count <= 3:
        # Leads with few attempts still get good priority
        score += 500 - (call_count * 100)  # 400 for 1 call, 300 for 2 calls, 200 for 3 calls
    elif call_count >= 10:
        # Many attempts with no success - reduce priority
        score -= 300
    
    # === DAILY SEQUENCE PROGRESSION ===
    # If the lead was called today already, reduce priority unless in first-day sequence
    if lead['last_call_attempt'] and lead['last_call_attempt'].date() == now:
        if days_since_added == 0 and call_count < 3:
            # First day sequence: Allow multiple calls same day (initial call pattern)
            score += 0  # No penalty
        else:
            # Otherwise, reduce priority of leads called today to spread calls across leads
            score -= 800
    
    # === IMPORTANCE MODIFIER ===
    # Final adjustments based on explicit importance
    if lead['importance'] == 'high':
        score += 300
    elif lead['importance'] == 'low':
        score -= 100
    
    # === CALL RESULT HANDLING ===
    # Prioritize promising leads based on last call result
    if lead.get('last_call_result') == 'interested':
        score += 500
    elif lead.get('last_call_result') == 'callback_requested':
        score += 400
    elif lead.get('last_call_result') == 'voicemail':
        score += 100  # Slight boost for voicemail vs no answer
    
    # === DO NOT CALL ===
    # If marked as do not call, give lowest possible score
    if lead['do_not_call']:
        score = -9999
    
    return score

def determine_next_call_time(lead, conn=None):
    """
    Determine when to schedule the next call based on the lead's history
    and the defined sequence rules.
    """
    should_close = False
    if conn is None:
        conn = psycopg2.connect(DATABASE_URL)
        should_close = True
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get the lead's sequence info
        cursor.execute('SELECT * FROM lead_sequence WHERE lead_id = %s', (lead['id'],))
        sequence = cursor.fetchone()
        
        if not sequence:
            # Create a new sequence record
            cursor.execute(
                'INSERT INTO lead_sequence (lead_id, sequence_step, next_call_time) VALUES (%s, 0, NULL) RETURNING *',
                (lead['id'],)
            )
            sequence = cursor.fetchone()
            conn.commit()
        
        now = datetime.now()
        days_since_added = (now.date() - lead['added_date'].date()).days if lead['added_date'] else 0
        call_count = lead['call_count'] or 0
        sequence_step = sequence['sequence_step'] or 0
        
        # Determine next call time based on sequence rules
        
        # === HANDLING FOLLOW-UPS ===
        # If follow-up date is set, respect that over the normal sequence
        if lead['follow_up_date']:
            if lead['follow_up_date'] > now.date():
                # Schedule for 9 AM on the follow-up date
                next_date = lead['follow_up_date']
                next_call_time = datetime.combine(next_date, datetime.min.time()) + timedelta(hours=9)
                new_step = sequence_step
                
                cursor.execute(
                    'UPDATE lead_sequence SET next_call_time = %s, updated_at = NOW() WHERE id = %s',
                    (next_call_time, sequence['id'])
                )
                conn.commit()
                return next_call_time
        
        # === INITIAL CALL SEQUENCE (DAY 0) ===
        # Special pattern for new leads: 3 calls within first day
        if days_since_added == 0:
            if call_count == 1:
                # After first call, try again in 5 minutes
                next_call_time = now + timedelta(minutes=5)
                new_step = 1
            elif call_count == 2:
                # After second call, try again in 2 hours
                next_call_time = now + timedelta(hours=2)
                new_step = 2
            else:
                # After third call same day, move to day 1 schedule
                next_day = now.date() + timedelta(days=1)
                next_call_time = datetime.combine(next_day, datetime.min.time()) + timedelta(hours=9)  # 9 AM
                new_step = 3
        
        # === WEEK 1 SEQUENCE (DAYS 1-7) ===
        # First week: two calls daily, 3 hours apart
        elif days_since_added <= 7:
            # Check if we've already called once today
            if lead['last_call_attempt'] and lead['last_call_attempt'].date() == now.date():
                # Second call of the day - schedule for 3 hours after the last call
                next_call_time = lead['last_call_attempt'] + timedelta(hours=3)
                
                # If that would make it too late in the day, push to tomorrow
                if next_call_time.hour >= 17:  # Don't call after 5 PM
                    next_day = now.date() + timedelta(days=1)
                    next_call_time = datetime.combine(next_day, datetime.min.time()) + timedelta(hours=9)  # 9 AM
            else:
                # First call of the day - if it's already afternoon, call now, otherwise 9 AM
                if now.hour >= 12:
                    next_call_time = now
                else:
                    next_call_time = datetime.combine(now.date(), datetime.min.time()) + timedelta(hours=9)  # 9 AM
            
            new_step = sequence_step + 1
        
        # === WEEK 2 SEQUENCE (DAYS 8-14) ===
        # Second week: one call per day
        elif days_since_added <= 14:
            # If we've already called today, schedule for tomorrow
            if lead['last_call_attempt'] and lead['last_call_attempt'].date() == now.date():
                next_day = now.date() + timedelta(days=1)
                next_call_time = datetime.combine(next_day, datetime.min.time()) + timedelta(hours=10)  # 10 AM
            else:
                # Call today if it's before 5 PM, otherwise tomorrow
                if now.hour < 17:
                    next_call_time = now
                else:
                    next_day = now.date() + timedelta(days=1)
                    next_call_time = datetime.combine(next_day, datetime.min.time()) + timedelta(hours=10)  # 10 AM
            
            new_step = sequence_step + 1
        
        # === WEEKS 3-4 SEQUENCE (DAYS 15-28) ===
        # Third and fourth weeks: call every 3 days
        elif days_since_added <= 28:
            next_day = now.date() + timedelta(days=3)
            next_call_time = datetime.combine(next_day, datetime.min.time()) + timedelta(hours=11)  # 11 AM
            new_step = sequence_step + 1
        
        # === WEEKS 5-12 SEQUENCE (DAYS 29-90) ===
        # Until 90 days: call weekly
        elif days_since_added <= 90:
            next_day = now.date() + timedelta(days=7)
            next_call_time = datetime.combine(next_day, datetime.min.time()) + timedelta(hours=14)  # 2 PM
            new_step = sequence_step + 1
        
        # === AFTER 90 DAYS ===
        # After 90 days, move to an inactive status
        else:
            next_call_time = None
            new_step = sequence_step
            
            # Update lead status to inactive
            cursor.execute(
                "UPDATE leads SET status = 'inactive' WHERE id = %s",
                (lead['id'],)
            )
        
        # Update the sequence
        cursor.execute(
            'UPDATE lead_sequence SET sequence_step = %s, next_call_time = %s, updated_at = NOW() WHERE id = %s',
            (new_step, next_call_time, sequence['id'])
        )
        conn.commit()
        
        return next_call_time
    
    finally:
        if should_close and conn:
            conn.close()

def get_unused_twilio_number(lead_id, conn=None):
    """
    Get a Twilio number that hasn't been used recently for this lead.
    For new leads, ensure we use a different number for each of the 
    first three calls.
    """
    should_close = False
    if conn is None:
        conn = psycopg2.connect(DATABASE_URL)
        should_close = True
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get lead info to check if it's a new lead (first day)
        cursor.execute('SELECT added_date, call_count FROM leads WHERE id = %s', (lead_id,))
        lead = cursor.fetchone()
        
        if not lead:
            # If lead not found, just return a random number
            return random.choice(twilio_numbers) if twilio_numbers else None
        
        days_since_added = (datetime.now().date() - lead['added_date'].date()).days if lead['added_date'] else 0
        call_count = lead['call_count'] or 0
        
        # For new leads on first day, ensure we use different numbers for first 3 calls
        if days_since_added == 0 and call_count < 3:
            # Get numbers already used for this lead today
            cursor.execute(
                '''SELECT twilio_number FROM used_numbers 
                   WHERE lead_id = %s AND date(call_time) = CURRENT_DATE
                   ORDER BY call_time DESC''',
                (lead_id,)
            )
            
            used_today = [row['twilio_number'] for row in cursor.fetchall()]
            
            # Filter out numbers used today
            available_numbers = [num for num in twilio_numbers if num not in used_today]
            
            # If we've used all numbers already, just pick a random one
            if not available_numbers and twilio_numbers:
                available_numbers = twilio_numbers
        else:
            # For all other cases, just don't use the most recently used number
            cursor.execute(
                'SELECT twilio_number FROM used_numbers WHERE lead_id = %s ORDER BY call_time DESC LIMIT 1',
                (lead_id,)
            )
            
            result = cursor.fetchone()
            last_used = result['twilio_number'] if result else None
            
            available_numbers = [num for num in twilio_numbers if num != last_used]
            if not available_numbers and twilio_numbers:
                available_numbers = twilio_numbers
        
        # Select a random number from available ones
        selected_number = random.choice(available_numbers) if available_numbers else None
        
        if selected_number:
            # Record this number as used
            cursor.execute(
                'INSERT INTO used_numbers (lead_id, twilio_number) VALUES (%s, %s)',
                (lead_id, selected_number)
            )
            conn.commit()
        
        return selected_number
    
    finally:
        if should_close and conn:
            conn.close()

# Automated calling background process
def call_scheduler_job():
    """
    Background job to automatically call leads based on priority.
    This runs continuously checking for leads to call.
    """
    conn = None
    try:
        conn = create_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get all active leads
        cursor.execute('''
            SELECT l.*, ls.sequence_step, ls.next_call_time 
            FROM leads l
            LEFT JOIN lead_sequence ls ON l.id = ls.lead_id
            WHERE l.do_not_call = FALSE AND l.status != 'inactive'
        ''')
        
        leads = cursor.fetchall()
        now = datetime.now()
        
        # Filter leads eligible for calling right now
        eligible_leads = []
        for lead in leads:
            # Skip leads with future follow-up dates
            if lead['follow_up_date'] and lead['follow_up_date'] > now.date():
                continue
                
            # Skip leads that are scheduled for future calls based on sequence
            if lead['next_call_time'] and lead['next_call_time'] > now:
                continue
                
            # Include leads with no next_call_time (never called) or past next_call_time
            eligible_leads.append(lead)
        
        if not eligible_leads:
            logger.info("No leads eligible for calling right now")
            return
        
        # Score and sort eligible leads
        for lead in eligible_leads:
            lead['calculated_score'] = calculate_lead_score(lead)
        
        eligible_leads.sort(key=lambda x: x['calculated_score'], reverse=True)
        
        # Select the highest priority lead
        top_lead = eligible_leads[0]
        logger.info(f"Auto-calling highest priority lead: {top_lead['name']} ({top_lead['phone_number']}) - Score: {top_lead['calculated_score']}")
        
        # Get a Twilio number to use
        from_number = get_unused_twilio_number(top_lead['id'], conn)
        if not from_number:
            logger.error("No Twilio numbers available")
            return
        
        # Make the call
        call = client.calls.create(
            to=top_lead['phone_number'],
            from_=from_number,
            url=twiml_url,
            status_callback=f"https://your-domain.com/twilio_status_callback"
        )
        
        # Record the call in history
        cursor.execute(
            '''INSERT INTO call_history 
               (lead_id, to_number, from_number, call_sid, status) 
               VALUES (%s, %s, %s, %s, %s) RETURNING id''',
            (top_lead['id'], top_lead['phone_number'], from_number, call.sid, 'Initiated')
        )
        
        # Update lead's call count and last attempt
        cursor.execute(
            '''UPDATE leads 
               SET call_count = call_count + 1, 
                   last_call_attempt = NOW(),
                   status = CASE WHEN status = 'new' THEN 'in_progress' ELSE status END
               WHERE id = %s''',
            (top_lead['id'],)
        )
        
        # Determine when to call this lead next
        determine_next_call_time(top_lead, conn)
        
        conn.commit()
        logger.info(f"Call initiated to {top_lead['phone_number']} from {from_number}")
    
    except Exception as e:
        logger.error(f"Error in call scheduler: {str(e)}")
        if conn:
            conn.rollback()
    
    finally:
        if conn:
            conn.close()

# Thread to run the scheduler
def run_scheduler():
    while True:
        try:
            # Only run during business hours (8 AM - 8 PM)
            current_hour = datetime.now().hour
            if 8 <= current_hour < 20:
                call_scheduler_job()
            else:
                logger.info("Outside of call hours (8 AM - 8 PM)")
            
            time.sleep(30)  # Check every 30 seconds
        except Exception as e:
            logger.error(f"Scheduler error: {str(e)}")
            time.sleep(60)  # If there was an error, wait a bit longer

# Start the scheduler in a background thread
scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
scheduler_thread.start()

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/leads')
def get_leads():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    sort_by = request.args.get('sort_by', 'score')
    sort_dir = request.args.get('sort_dir', 'desc')
    is_hot = request.args.get('is_hot', None)
    
    offset = (page - 1) * limit
    
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query_conditions = ['1=1']
    params = []
    
    if search:
        query_conditions.append("(phone_number ILIKE %s OR name ILIKE %s)")
        search_param = f'%{search}%'
        params.extend([search_param, search_param])
    
    if status:
        query_conditions.append("status = %s")
        params.append(status)
    
    if is_hot is not None:
        is_hot_bool = is_hot.lower() in ('true', 'yes', '1')
        query_conditions.append("is_hot = %s")
        params.append(is_hot_bool)
    
    # Get total count
    count_query = f'''
        SELECT COUNT(*) as total
        FROM leads
        WHERE {' AND '.join(query_conditions)}
    '''
    cursor.execute(count_query, params)
    total = cursor.fetchone()['total']
    
    # Get leads with sequence data
    leads_query = f'''
        SELECT l.*, ls.sequence_step, ls.next_call_time
        FROM leads l
        LEFT JOIN lead_sequence ls ON l.id = ls.lead_id
        WHERE {' AND '.join(query_conditions)}
    '''
    cursor.execute(leads_query, params)
    leads = cursor.fetchall()
    
    # Calculate scores for sorting
    for lead in leads:
        lead['calculated_score'] = calculate_lead_score(lead)
        # Calculate days since added for display
        lead['days_since_added'] = (datetime.now().date() - lead['added_date'].date()).days if lead['added_date'] else 0
    
    # Sort leads
    if sort_by == 'score':
        leads.sort(key=lambda x: x['calculated_score'], reverse=(sort_dir == 'desc'))
    elif sort_by == 'added_date':
        leads.sort(key=lambda x: x['added_date'] if x['added_date'] else datetime.min, reverse=(sort_dir == 'desc'))
    elif sort_by == 'call_count':
        leads.sort(key=lambda x: x['call_count'] if x['call_count'] else 0, reverse=(sort_dir == 'desc'))
    elif sort_by == 'last_call':
        leads.sort(key=lambda x: x['last_call_attempt'] if x['last_call_attempt'] else datetime.min, reverse=(sort_dir == 'desc'))
    
    # Apply pagination
    paginated_leads = leads[offset:offset + limit]
    
    # Get call counts for each lead
    for lead in paginated_leads:
        cursor.execute('SELECT COUNT(*) as count FROM call_history WHERE lead_id = %s', (lead['id'],))
        result = cursor.fetchone()
        lead['actual_call_count'] = result['count'] if result else 0
    
    return jsonify({
        "success": True,
        "leads": paginated_leads,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    })

@app.route('/leads/<int:lead_id>', methods=['GET'])
def get_lead(lead_id):
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute('SELECT * FROM leads WHERE id = %s', (lead_id,))
    lead = cursor.fetchone()
    
    if not lead:
        return jsonify({"error": "Lead not found"}), 404
    
    # Get call history
    cursor.execute('SELECT * FROM call_history WHERE lead_id = %s ORDER BY call_time DESC', (lead_id,))
    calls = cursor.fetchall()
    
    # Get sequence information
    cursor.execute('SELECT * FROM lead_sequence WHERE lead_id = %s', (lead_id,))
    sequence = cursor.fetchone()
    
    # Get used numbers
    cursor.execute('SELECT * FROM used_numbers WHERE lead_id = %s ORDER BY call_time DESC', (lead_id,))
    used_numbers = cursor.fetchall()
    
    lead['calls'] = calls
    lead['sequence'] = sequence
    lead['used_numbers'] = used_numbers
    lead['calculated_score'] = calculate_lead_score(lead)
    lead['days_since_added'] = (datetime.now().date() - lead['added_date'].date()).days if lead['added_date'] else 0
    
    return jsonify({
        "success": True,
        "lead": lead
    })

@app.route('/leads', methods=['POST'])
def add_lead():
    data = request.get_json()
    
    phone_number = data.get('phone_number')
    if not phone_number:
        return jsonify({"error": "Phone number is required"}), 400
    
    # Normalize the number format
    phone_number = phone_number.strip()
    if not phone_number.startswith('+'):
        phone_number = '+' + phone_number
    
    name = data.get('name', '')
    notes = data.get('notes', '')
    importance = data.get('importance', 'normal')
    is_hot = data.get('is_hot', False)
    email = data.get('email', '')
    company = data.get('company', '')
    
    follow_up_date = None
    if data.get('follow_up_date'):
        try:
            follow_up_date = datetime.strptime(data.get('follow_up_date'), '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Invalid follow-up date format. Use YYYY-MM-DD"}), 400
    
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Check if lead already exists
        cursor.execute('SELECT id FROM leads WHERE phone_number = %s', (phone_number,))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing lead
            cursor.execute(
                '''UPDATE leads 
                   SET name = %s, 
                       notes = %s, 
                       importance = %s, 
                       is_hot = %s,
                       follow_up_date = %s,
                       email = %s,
                       company = %s,
                       status = CASE WHEN status = 'do_not_call' THEN status ELSE 'active' END
                   WHERE id = %s
                   RETURNING *''',
                (name, notes, importance, is_hot, follow_up_date, email, company, existing['id'])
            )
            lead = cursor.fetchone()
            
            # If lead exists but has no sequence, create one
            cursor.execute('SELECT id FROM lead_sequence WHERE lead_id = %s', (lead['id'],))
            if not cursor.fetchone():
                cursor.execute(
                    'INSERT INTO lead_sequence (lead_id, sequence_step, next_call_time) VALUES (%s, 0, NULL)',
                    (lead['id'],)
                )
                
        else:
            # Insert new lead
            cursor.execute(
                '''INSERT INTO leads 
                   (phone_number, name, notes, importance, is_hot, follow_up_date, status, email, company) 
                   VALUES (%s, %s, %s, %s, %s, %s, 'new', %s, %s)
                   RETURNING *''',
                (phone_number, name, notes, importance, is_hot, follow_up_date, email, company)
            )
            lead = cursor.fetchone()
            
            # Create initial sequence record
            cursor.execute(
                'INSERT INTO lead_sequence (lead_id, sequence_step, next_call_time) VALUES (%s, 0, NULL)',
                (
