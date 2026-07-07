CREATE EXTENSION IF NOT EXISTS postgis;--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"layer_ids" text[] NOT NULL,
	"geom" geography(Point,4326) NOT NULL,
	"year" integer NOT NULL,
	"votes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "events_geom_gix" ON "events" USING gist ("geom");--> statement-breakpoint
CREATE INDEX "events_layer_ids_gin" ON "events" USING gin ("layer_ids");--> statement-breakpoint
CREATE INDEX "events_year_idx" ON "events" USING btree ("year");--> statement-breakpoint
CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at" DESC);