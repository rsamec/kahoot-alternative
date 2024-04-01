alter table "public"."answers" add column "game_id" uuid not null;

alter table "public"."games" add column "quiz_id" uuid not null;

alter table "public"."answers" add constraint "public_answers_game_id_fkey" FOREIGN KEY (game_id) REFERENCES games(id) not valid;

alter table "public"."answers" validate constraint "public_answers_game_id_fkey";

alter table "public"."games" add constraint "public_games_quiz_id_fkey" FOREIGN KEY (quiz_id) REFERENCES quizes(id) not valid;

alter table "public"."games" validate constraint "public_games_quiz_id_fkey";



