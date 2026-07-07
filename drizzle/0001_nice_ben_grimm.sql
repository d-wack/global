CREATE TABLE "event_votes" (
	"event_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"direction" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_votes_event_id_user_id_pk" PRIMARY KEY("event_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "event_votes" ADD CONSTRAINT "event_votes_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_votes_event_id_idx" ON "event_votes" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "events_created_by_idx" ON "events" USING btree ("created_by");