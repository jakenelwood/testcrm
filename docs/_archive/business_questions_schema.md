# 📊 GardenOS Database & Usage Profile

## 1. 👥 User Scale

* **Concurrent users at peak:** 50–100 (initial production phase)
* **Total user capacity:** Designed to scale to 1,000+ users across multiple agencies

---

## 2. 🔄 Query Patterns

**Most common query types:**

* 🔍 **Lead listing and filtering**

  * Example: "Show all leads from Campaign X not contacted in 7 days"

* 👤 **Client detail retrieval**

  * Example: Load name, contact info, policies, and communication logs

* 🏠 **Insurance-specific lookups**

  * Example: “List homes with policies expiring soon” or “Carrier breakdowns”

* 📅 **Task and follow-up queries**

  * Example: “Show overdue tasks for this agent” or “Upcoming client reviews”

* 📥 **Message & thread retrieval**

  * Load message history, AI summaries, and contact logs

---

## 3. ⚖️ Read vs. Write Ratio

* **70–80% Read-heavy** workload
* **20–30% Write operations**:

  * New leads, call logs, tasks, follow-ups, and AI-generated notes
  * Occasional document ingestion and embedding (PDFs, summaries)

---

## 4. 📦 Data Volume (Est. First 12–18 Months)

* **Leads:** 100,000+
* **Clients:** 25,000+
* **Communications (calls, emails, messages):** 1,000,000+
* **Tasks, Follow-ups, Notes:** 500,000+
* **Documents (PDFs):** 3,000–5,000 (avg. 10 pages each)

---

## 5. 🤖 AI Integration Priorities

**Most critical AI features:**

* 🔢 **Lead scoring & prioritization**
* 📬 **Automated follow-ups (email/SMS triggers)**
* ✍️ **Content generation**

  * Emails, summaries, responses, prospecting scripts
* 🔍 **Insight extraction**

  * From calls, PDFs, and chat threads

---

## 6. 📈 Reporting Needs

* 🧠 **Pipeline health reports**

  * Per agent, campaign, team, or timeframe
* ⏱️ **Response/Conversion times**
* 📊 **Lead source performance**
* 📉 **Quote and policy trends**
* 📄 **AI engagement metrics**
* 🗃️ **CSV/JSON exports** for compliance or audits

---

## 7. 🏢 Multi-Tenancy Support

* ✅ Fully multi-tenant

  * Scoped by `agency_id`
  * Role-based access via `user_id` and `team_id`
  * Isolated lead pools per agency
* 🔐 Logical data isolation ensures privacy and scalability
