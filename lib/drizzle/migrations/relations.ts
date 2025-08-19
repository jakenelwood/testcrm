import { relations } from "drizzle-orm/relations";
import { workspaces, users, accounts, notes, contacts, opportunities, tasks, documents, pipelines, vehicles, properties, specialtyItems, campaigns, abTests, campaignParticipants, campaignTransitions, reengagementSchedule, campaignMetrics, insurancePolicies, insuranceQuotes, opportunityParticipants } from "./schema";

export const usersRelations = relations(users, ({one, many}) => ({
	workspace: one(workspaces, {
		fields: [users.workspaceId],
		references: [workspaces.id]
	}),
	notes: many(notes),
	tasks_assignedToId: many(tasks, {
		relationName: "tasks_assignedToId_users_id"
	}),
	tasks_createdById: many(tasks, {
		relationName: "tasks_createdById_users_id"
	}),
	documents: many(documents),
	campaigns: many(campaigns),
	campaignTransitions: many(campaignTransitions),
	contacts: many(contacts),
	insurancePolicies: many(insurancePolicies),
	accounts: many(accounts),
	insuranceQuotes: many(insuranceQuotes),
	opportunities: many(opportunities),
}));

export const workspacesRelations = relations(workspaces, ({many}) => ({
	users: many(users),
	notes: many(notes),
	tasks: many(tasks),
	documents: many(documents),
	pipelines: many(pipelines),
	vehicles: many(vehicles),
	properties: many(properties),
	specialtyItems: many(specialtyItems),
	campaigns: many(campaigns),
	abTests: many(abTests),
	campaignParticipants: many(campaignParticipants),
	campaignTransitions: many(campaignTransitions),
	reengagementSchedules: many(reengagementSchedule),
	campaignMetrics: many(campaignMetrics),
	contacts: many(contacts),
	insurancePolicies: many(insurancePolicies),
	accounts: many(accounts),
	insuranceQuotes: many(insuranceQuotes),
	opportunities: many(opportunities),
	opportunityParticipants: many(opportunityParticipants),
}));

export const notesRelations = relations(notes, ({one}) => ({
	account: one(accounts, {
		fields: [notes.accountId],
		references: [accounts.id]
	}),
	contact: one(contacts, {
		fields: [notes.contactId],
		references: [contacts.id]
	}),
	opportunity: one(opportunities, {
		fields: [notes.opportunityId],
		references: [opportunities.id]
	}),
	user: one(users, {
		fields: [notes.userId],
		references: [users.id]
	}),
	workspace: one(workspaces, {
		fields: [notes.workspaceId],
		references: [workspaces.id]
	}),
}));

export const accountsRelations = relations(accounts, ({one, many}) => ({
	notes: many(notes),
	tasks: many(tasks),
	documents: many(documents),
	campaignParticipants: many(campaignParticipants),
	campaignMetrics: many(campaignMetrics),
	contacts: many(contacts),
	insurancePolicies: many(insurancePolicies),
	user: one(users, {
		fields: [accounts.ownerId],
		references: [users.id]
	}),
	workspace: one(workspaces, {
		fields: [accounts.workspaceId],
		references: [workspaces.id]
	}),
	insuranceQuotes: many(insuranceQuotes),
	opportunities: many(opportunities),
}));

export const contactsRelations = relations(contacts, ({one, many}) => ({
	notes: many(notes),
	tasks: many(tasks),
	documents: many(documents),
	vehicles: many(vehicles),
	properties: many(properties),
	specialtyItems: many(specialtyItems),
	campaignParticipants: many(campaignParticipants),
	campaignTransitions: many(campaignTransitions),
	reengagementSchedules: many(reengagementSchedule),
	campaignMetrics: many(campaignMetrics),
	account: one(accounts, {
		fields: [contacts.accountId],
		references: [accounts.id]
	}),
	user: one(users, {
		fields: [contacts.ownerId],
		references: [users.id]
	}),
	contact: one(contacts, {
		fields: [contacts.referredBy],
		references: [contacts.id],
		relationName: "contacts_referredBy_contacts_id"
	}),
	contacts: many(contacts, {
		relationName: "contacts_referredBy_contacts_id"
	}),
	workspace: one(workspaces, {
		fields: [contacts.workspaceId],
		references: [workspaces.id]
	}),
	campaign: one(campaigns, {
		fields: [contacts.currentCampaignId],
		references: [campaigns.id]
	}),
	insurancePolicies: many(insurancePolicies),
	insuranceQuotes: many(insuranceQuotes),
	opportunities: many(opportunities),
	opportunityParticipants: many(opportunityParticipants),
}));

export const opportunitiesRelations = relations(opportunities, ({one, many}) => ({
	notes: many(notes),
	tasks: many(tasks),
	documents: many(documents),
	insurancePolicies: many(insurancePolicies),
	insuranceQuotes: many(insuranceQuotes),
	abTest: one(abTests, {
		fields: [opportunities.abTestId],
		references: [abTests.id]
	}),
	account: one(accounts, {
		fields: [opportunities.accountId],
		references: [accounts.id]
	}),
	campaign: one(campaigns, {
		fields: [opportunities.campaignId],
		references: [campaigns.id]
	}),
	contact: one(contacts, {
		fields: [opportunities.contactId],
		references: [contacts.id]
	}),
	user: one(users, {
		fields: [opportunities.ownerId],
		references: [users.id]
	}),
	workspace: one(workspaces, {
		fields: [opportunities.workspaceId],
		references: [workspaces.id]
	}),
	opportunityParticipants: many(opportunityParticipants),
}));

export const tasksRelations = relations(tasks, ({one}) => ({
	account: one(accounts, {
		fields: [tasks.accountId],
		references: [accounts.id]
	}),
	user_assignedToId: one(users, {
		fields: [tasks.assignedToId],
		references: [users.id],
		relationName: "tasks_assignedToId_users_id"
	}),
	contact: one(contacts, {
		fields: [tasks.contactId],
		references: [contacts.id]
	}),
	user_createdById: one(users, {
		fields: [tasks.createdById],
		references: [users.id],
		relationName: "tasks_createdById_users_id"
	}),
	opportunity: one(opportunities, {
		fields: [tasks.opportunityId],
		references: [opportunities.id]
	}),
	workspace: one(workspaces, {
		fields: [tasks.workspaceId],
		references: [workspaces.id]
	}),
}));

export const documentsRelations = relations(documents, ({one}) => ({
	account: one(accounts, {
		fields: [documents.accountId],
		references: [accounts.id]
	}),
	contact: one(contacts, {
		fields: [documents.contactId],
		references: [contacts.id]
	}),
	opportunity: one(opportunities, {
		fields: [documents.opportunityId],
		references: [opportunities.id]
	}),
	user: one(users, {
		fields: [documents.uploadedById],
		references: [users.id]
	}),
	workspace: one(workspaces, {
		fields: [documents.workspaceId],
		references: [workspaces.id]
	}),
}));

export const pipelinesRelations = relations(pipelines, ({one}) => ({
	workspace: one(workspaces, {
		fields: [pipelines.workspaceId],
		references: [workspaces.id]
	}),
}));

export const vehiclesRelations = relations(vehicles, ({one}) => ({
	contact: one(contacts, {
		fields: [vehicles.contactId],
		references: [contacts.id]
	}),
	workspace: one(workspaces, {
		fields: [vehicles.workspaceId],
		references: [workspaces.id]
	}),
}));

export const propertiesRelations = relations(properties, ({one}) => ({
	contact: one(contacts, {
		fields: [properties.contactId],
		references: [contacts.id]
	}),
	workspace: one(workspaces, {
		fields: [properties.workspaceId],
		references: [workspaces.id]
	}),
}));

export const specialtyItemsRelations = relations(specialtyItems, ({one}) => ({
	contact: one(contacts, {
		fields: [specialtyItems.contactId],
		references: [contacts.id]
	}),
	workspace: one(workspaces, {
		fields: [specialtyItems.workspaceId],
		references: [workspaces.id]
	}),
}));

export const campaignsRelations = relations(campaigns, ({one, many}) => ({
	user: one(users, {
		fields: [campaigns.ownerId],
		references: [users.id]
	}),
	workspace: one(workspaces, {
		fields: [campaigns.workspaceId],
		references: [workspaces.id]
	}),
	abTests: many(abTests),
	campaignParticipants: many(campaignParticipants),
	campaignTransitions_fromCampaignId: many(campaignTransitions, {
		relationName: "campaignTransitions_fromCampaignId_campaigns_id"
	}),
	campaignTransitions_toCampaignId: many(campaignTransitions, {
		relationName: "campaignTransitions_toCampaignId_campaigns_id"
	}),
	reengagementSchedules: many(reengagementSchedule),
	campaignMetrics: many(campaignMetrics),
	contacts: many(contacts),
	opportunities: many(opportunities),
}));

export const abTestsRelations = relations(abTests, ({one, many}) => ({
	campaign: one(campaigns, {
		fields: [abTests.campaignId],
		references: [campaigns.id]
	}),
	workspace: one(workspaces, {
		fields: [abTests.workspaceId],
		references: [workspaces.id]
	}),
	campaignParticipants: many(campaignParticipants),
	campaignMetrics: many(campaignMetrics),
	opportunities: many(opportunities),
}));

export const campaignParticipantsRelations = relations(campaignParticipants, ({one}) => ({
	abTest: one(abTests, {
		fields: [campaignParticipants.abTestId],
		references: [abTests.id]
	}),
	account: one(accounts, {
		fields: [campaignParticipants.accountId],
		references: [accounts.id]
	}),
	campaign: one(campaigns, {
		fields: [campaignParticipants.campaignId],
		references: [campaigns.id]
	}),
	contact: one(contacts, {
		fields: [campaignParticipants.contactId],
		references: [contacts.id]
	}),
	workspace: one(workspaces, {
		fields: [campaignParticipants.workspaceId],
		references: [workspaces.id]
	}),
}));

export const campaignTransitionsRelations = relations(campaignTransitions, ({one}) => ({
	contact: one(contacts, {
		fields: [campaignTransitions.contactId],
		references: [contacts.id]
	}),
	campaign_fromCampaignId: one(campaigns, {
		fields: [campaignTransitions.fromCampaignId],
		references: [campaigns.id],
		relationName: "campaignTransitions_fromCampaignId_campaigns_id"
	}),
	campaign_toCampaignId: one(campaigns, {
		fields: [campaignTransitions.toCampaignId],
		references: [campaigns.id],
		relationName: "campaignTransitions_toCampaignId_campaigns_id"
	}),
	user: one(users, {
		fields: [campaignTransitions.transitionedBy],
		references: [users.id]
	}),
	workspace: one(workspaces, {
		fields: [campaignTransitions.workspaceId],
		references: [workspaces.id]
	}),
}));

export const reengagementScheduleRelations = relations(reengagementSchedule, ({one}) => ({
	campaign: one(campaigns, {
		fields: [reengagementSchedule.campaignId],
		references: [campaigns.id]
	}),
	contact: one(contacts, {
		fields: [reengagementSchedule.contactId],
		references: [contacts.id]
	}),
	workspace: one(workspaces, {
		fields: [reengagementSchedule.workspaceId],
		references: [workspaces.id]
	}),
}));

export const campaignMetricsRelations = relations(campaignMetrics, ({one}) => ({
	abTest: one(abTests, {
		fields: [campaignMetrics.abTestId],
		references: [abTests.id]
	}),
	account: one(accounts, {
		fields: [campaignMetrics.accountId],
		references: [accounts.id]
	}),
	campaign: one(campaigns, {
		fields: [campaignMetrics.campaignId],
		references: [campaigns.id]
	}),
	contact: one(contacts, {
		fields: [campaignMetrics.contactId],
		references: [contacts.id]
	}),
	workspace: one(workspaces, {
		fields: [campaignMetrics.workspaceId],
		references: [workspaces.id]
	}),
}));

export const insurancePoliciesRelations = relations(insurancePolicies, ({one}) => ({
	account: one(accounts, {
		fields: [insurancePolicies.accountId],
		references: [accounts.id]
	}),
	contact: one(contacts, {
		fields: [insurancePolicies.contactId],
		references: [contacts.id]
	}),
	opportunity: one(opportunities, {
		fields: [insurancePolicies.opportunityId],
		references: [opportunities.id]
	}),
	user: one(users, {
		fields: [insurancePolicies.ownerId],
		references: [users.id]
	}),
	workspace: one(workspaces, {
		fields: [insurancePolicies.workspaceId],
		references: [workspaces.id]
	}),
}));

export const insuranceQuotesRelations = relations(insuranceQuotes, ({one}) => ({
	account: one(accounts, {
		fields: [insuranceQuotes.accountId],
		references: [accounts.id]
	}),
	contact: one(contacts, {
		fields: [insuranceQuotes.contactId],
		references: [contacts.id]
	}),
	user: one(users, {
		fields: [insuranceQuotes.createdById],
		references: [users.id]
	}),
	opportunity: one(opportunities, {
		fields: [insuranceQuotes.opportunityId],
		references: [opportunities.id]
	}),
	workspace: one(workspaces, {
		fields: [insuranceQuotes.workspaceId],
		references: [workspaces.id]
	}),
}));

export const opportunityParticipantsRelations = relations(opportunityParticipants, ({one}) => ({
	contact: one(contacts, {
		fields: [opportunityParticipants.contactId],
		references: [contacts.id]
	}),
	opportunity: one(opportunities, {
		fields: [opportunityParticipants.opportunityId],
		references: [opportunities.id]
	}),
	workspace: one(workspaces, {
		fields: [opportunityParticipants.workspaceId],
		references: [workspaces.id]
	}),
}));