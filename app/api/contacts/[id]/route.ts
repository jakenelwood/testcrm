import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle/db';
import { contacts, opportunities, interactions } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateContactSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  contactType: z.enum(['individual', 'business']).optional(),
  status: z.enum(['lead', 'prospect', 'client', 'inactive']).optional(),
  addressId: z.string().uuid().optional(),
  mailingAddressId: z.string().uuid().optional(),
  
  // Personal fields
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed', 'other']).optional(),
  driversLicense: z.string().optional(),
  licenseState: z.string().optional(),
  occupation: z.string().optional(),
  educationLevel: z.string().optional(),
  
  // Business fields
  industry: z.string().optional(),
  taxId: z.string().optional(),
  yearEstablished: z.number().optional(),
  annualRevenue: z.number().optional(),
  numberOfEmployees: z.number().optional(),
  businessType: z.string().optional(),
  
  // CRM fields
  source: z.string().optional(),
  referredBy: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  
  // AI fields
  aiSummary: z.string().optional(),
  aiRiskScore: z.number().min(0).max(100).optional(),
  aiLifetimeValue: z.number().optional(),
  aiChurnProbability: z.number().min(0).max(100).optional(),
  aiInsights: z.record(z.any()).optional(),
  
  // Contact tracking
  lastContactAt: z.string().optional(),
  nextContactAt: z.string().optional(),
}).partial();

// GET /api/contacts/[id] - Get a specific contact with relations
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id;
    
    // Validate UUID
    z.string().uuid().parse(contactId);
    
    // Get contact with all relations
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.id, contactId),
      with: {
        address: true,
        mailingAddress: true,
        creator: {
          columns: { id: true, fullName: true, email: true }
        },
        updater: {
          columns: { id: true, fullName: true, email: true }
        },
        referrer: {
          columns: { id: true, name: true, email: true }
        },
        referrals: {
          columns: { id: true, name: true, email: true, status: true }
        },
        opportunities: {
          with: {
            pipeline: true,
            stage: true,
          }
        },
        activities: {
          orderBy: (activities, { desc }) => [desc(activities.createdAt)],
          limit: 10, // Latest 10 activities
          with: {
            creator: {
              columns: { id: true, fullName: true }
            }
          }
        },
        insuranceProfile: true,
        insurancePolicies: {
          where: (policies, { eq }) => eq(policies.status, 'active'),
        }
      }
    });
    
    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    // Get activity summary
    const activitySummary = await db
      .select({
        type: activities.type,
        count: db.$count(activities.id),
      })
      .from(activities)
      .where(eq(activities.contactId, contactId))
      .groupBy(activities.type);
    
    // Get opportunity summary
    const opportunitySummary = await db
      .select({
        status: opportunities.status,
        count: db.$count(opportunities.id),
        totalValue: db.$sum(opportunities.value),
      })
      .from(opportunities)
      .where(eq(opportunities.contactId, contactId))
      .groupBy(opportunities.status);
    
    return NextResponse.json({
      success: true,
      data: {
        ...contact,
        summary: {
          activities: activitySummary,
          opportunities: opportunitySummary,
        }
      },
    });
    
  } catch (error) {
    console.error('Error fetching contact:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid contact ID' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch contact' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[id] - Update a specific contact
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id;
    const body = await request.json();
    
    // Validate UUID
    z.string().uuid().parse(contactId);
    
    // Validate update data
    const validatedData = updateContactSchema.parse(body);
    
    // Check if contact exists
    const existingContact = await db.query.contacts.findFirst({
      where: eq(contacts.id, contactId),
    });
    
    if (!existingContact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData = {
      ...validatedData,
      dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
      lastContactAt: validatedData.lastContactAt ? new Date(validatedData.lastContactAt) : undefined,
      nextContactAt: validatedData.nextContactAt ? new Date(validatedData.nextContactAt) : undefined,
      updatedBy: 'system', // TODO: Get from auth context
      updatedAt: new Date(),
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });
    
    const [updatedContact] = await db
      .update(contacts)
      .set(updateData)
      .where(eq(contacts.id, contactId))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: updatedContact,
      message: 'Contact updated successfully',
    });
    
  } catch (error) {
    console.error('Error updating contact:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update contact' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id] - Delete a specific contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id;
    
    // Validate UUID
    z.string().uuid().parse(contactId);
    
    // Check if contact exists
    const existingContact = await db.query.contacts.findFirst({
      where: eq(contacts.id, contactId),
    });
    
    if (!existingContact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    // Delete contact (cascade will handle related records)
    const [deletedContact] = await db
      .delete(contacts)
      .where(eq(contacts.id, contactId))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: deletedContact,
      message: 'Contact deleted successfully',
    });
    
  } catch (error) {
    console.error('Error deleting contact:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid contact ID' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete contact' 
      },
      { status: 500 }
    );
  }
}
