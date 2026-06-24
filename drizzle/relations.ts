import { relations } from "drizzle-orm/relations";
import { profiles, connections, events, jobs, blogs, news, conversations, eventRsvps, messages, supportTickets, vaultItems } from "./schema";

export const connectionsRelations = relations(connections, ({one}) => ({
	profile_fromProfileId: one(profiles, {
		fields: [connections.fromProfileId],
		references: [profiles.id],
		relationName: "connections_fromProfileId_profiles_id"
	}),
	profile_toProfileId: one(profiles, {
		fields: [connections.toProfileId],
		references: [profiles.id],
		relationName: "connections_toProfileId_profiles_id"
	}),
}));

export const profilesRelations = relations(profiles, ({many}) => ({
	connections_fromProfileId: many(connections, {
		relationName: "connections_fromProfileId_profiles_id"
	}),
	connections_toProfileId: many(connections, {
		relationName: "connections_toProfileId_profiles_id"
	}),
	events: many(events),
	jobs: many(jobs),
	blogs: many(blogs),
	news: many(news),
	conversations_participant1Id: many(conversations, {
		relationName: "conversations_participant1Id_profiles_id"
	}),
	conversations_participant2Id: many(conversations, {
		relationName: "conversations_participant2Id_profiles_id"
	}),
	eventRsvps: many(eventRsvps),
	messages: many(messages),
	supportTickets: many(supportTickets),
	vaultItems: many(vaultItems),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	profile: one(profiles, {
		fields: [events.organizerId],
		references: [profiles.id]
	}),
	eventRsvps: many(eventRsvps),
}));

export const jobsRelations = relations(jobs, ({one}) => ({
	profile: one(profiles, {
		fields: [jobs.postedById],
		references: [profiles.id]
	}),
}));

export const blogsRelations = relations(blogs, ({one}) => ({
	profile: one(profiles, {
		fields: [blogs.authorId],
		references: [profiles.id]
	}),
}));

export const newsRelations = relations(news, ({one}) => ({
	profile: one(profiles, {
		fields: [news.authorId],
		references: [profiles.id]
	}),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	profile_participant1Id: one(profiles, {
		fields: [conversations.participant1Id],
		references: [profiles.id],
		relationName: "conversations_participant1Id_profiles_id"
	}),
	profile_participant2Id: one(profiles, {
		fields: [conversations.participant2Id],
		references: [profiles.id],
		relationName: "conversations_participant2Id_profiles_id"
	}),
	messages: many(messages),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({one}) => ({
	event: one(events, {
		fields: [eventRsvps.eventId],
		references: [events.id]
	}),
	profile: one(profiles, {
		fields: [eventRsvps.userId],
		references: [profiles.id]
	}),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id]
	}),
	profile: one(profiles, {
		fields: [messages.senderId],
		references: [profiles.id]
	}),
}));

export const supportTicketsRelations = relations(supportTickets, ({one}) => ({
	profile: one(profiles, {
		fields: [supportTickets.userId],
		references: [profiles.id]
	}),
}));

export const vaultItemsRelations = relations(vaultItems, ({one}) => ({
	profile: one(profiles, {
		fields: [vaultItems.ownerId],
		references: [profiles.id]
	}),
}));