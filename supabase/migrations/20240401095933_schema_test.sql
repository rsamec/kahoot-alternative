alter table "public"."questions" drop constraint "questions_game_id_fkey";

drop index if exists "public"."questions_game_id_index";

create table "public"."quizes" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text,
    "code" text
);


alter table "public"."questions" drop column "game_id";

alter table "public"."questions" add column "quiz_id" uuid not null;

CREATE UNIQUE INDEX quizes_pkey ON public.quizes USING btree (id);

CREATE INDEX questions_game_id_index ON public.questions USING btree (quiz_id);

alter table "public"."quizes" add constraint "quizes_pkey" PRIMARY KEY using index "quizes_pkey";

alter table "public"."questions" add constraint "public_questions_quiz_id_fkey" FOREIGN KEY (quiz_id) REFERENCES quizes(id) not valid;

alter table "public"."questions" validate constraint "public_questions_quiz_id_fkey";

grant delete on table "public"."quizes" to "anon";

grant insert on table "public"."quizes" to "anon";

grant references on table "public"."quizes" to "anon";

grant select on table "public"."quizes" to "anon";

grant trigger on table "public"."quizes" to "anon";

grant truncate on table "public"."quizes" to "anon";

grant update on table "public"."quizes" to "anon";

grant delete on table "public"."quizes" to "authenticated";

grant insert on table "public"."quizes" to "authenticated";

grant references on table "public"."quizes" to "authenticated";

grant select on table "public"."quizes" to "authenticated";

grant trigger on table "public"."quizes" to "authenticated";

grant truncate on table "public"."quizes" to "authenticated";

grant update on table "public"."quizes" to "authenticated";

grant delete on table "public"."quizes" to "service_role";

grant insert on table "public"."quizes" to "service_role";

grant references on table "public"."quizes" to "service_role";

grant select on table "public"."quizes" to "service_role";

grant trigger on table "public"."quizes" to "service_role";

grant truncate on table "public"."quizes" to "service_role";

grant update on table "public"."quizes" to "service_role";



