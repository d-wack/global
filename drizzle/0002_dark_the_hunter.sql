CREATE TABLE "user_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"lng" double precision NOT NULL,
	"lat" double precision NOT NULL,
	"zoom" double precision NOT NULL,
	"year" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "user_views_user_id_created_at_idx" ON "user_views" USING btree ("user_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX "user_views_created_at_idx" ON "user_views" USING btree ("created_at" DESC);