'use client'

import React, { FormEvent, useEffect, useState } from 'react'
import { Choice, Player, Question, Game, supabase } from '@/types/types'
import { RealtimeChannel } from '@supabase/supabase-js'

enum Screens {
  register,
  lobby,
  quiz,
  results,
}

export default function Home({
  params: { id: gameId },
}: {
  params: { id: string }
}) {
  const onRegisterCompleted = (player: Player) => {
    setPlayer(player)
    setCurrentScreen(Screens.lobby)
  }

  const [player, setPlayer] = useState<Player | null>()

  const [currentScreen, setCurrentScreen] = useState(Screens.register)

  const [questions, setQuestions] = useState<Question[]>()

  const getQuestions = async () => {
    const { data, error } = await supabase
      .from("games")
      .select("*, quizes(*, questions(*, choices(*)))")
      .eq('id', gameId)
      .single()

    if (error) {
      return alert(error.message)
    }
    const quizQuestions = (data.quizes?.questions ?? []).sort((f,s) => f.order - s.order);
    setQuestions(quizQuestions)

    const choiceCount = quizQuestions.map((rows: Question) => rows.choices?.length)

    const correctCount = quizQuestions.map(
      (rows) =>
        rows.choices.filter((choice: Choice) => choice.is_correct).length
    )
  }

  const [currentQuestionSequence, setCurrentQuestionSequence] = useState(0)

  const setGameListner = (): RealtimeChannel => {
    return supabase
      .channel('game')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          // start the quiz game
          const game = payload.new as Game

          if (game.is_done) {
            setCurrentScreen(Screens.results)
          } else {
            setCurrentScreen(Screens.quiz)
            setCurrentQuestionSequence(game.current_question_sequence)
          }
        }
      )
      .subscribe()
  }

  useEffect(() => {
    getQuestions()
    const gameChannel = setGameListner()
    return () => {
      supabase.removeChannel(gameChannel)
    }
  }, [gameId])

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-2 md:p-4 lg:p-12">
      <div className="max-w-md m-auto p-8 bg-black  text-white">
        {currentScreen == Screens.register && (
          <Register gameId={gameId} onRegisterCompleted={onRegisterCompleted}></Register>
        )}
        {currentScreen == Screens.lobby && <Lobby player={player!}></Lobby>}
        {currentScreen == Screens.quiz && (
          <Quiz
            gameId={gameId}
            question={questions![currentQuestionSequence]}
            questionCount={questions!.length}
            playerId={player!.id}
          ></Quiz>
        )}
        {currentScreen == Screens.results && (
          <Results player={player!}></Results>
        )}
      </div>
    </main>
  )
}

function Results({ player }: { player: Player }) {
  return (
    <div>
      <h2 className="text-xl pb-4">{player.nickname}！</h2>
      <p>How was the game? Thanks for playing!</p>
    </div>
  )
}

function Quiz({
  gameId,
  question: question,
  questionCount: questionCount,
  playerId,
}: {
  gameId: string,
  question: Question
  questionCount: number
  playerId: string
}) {
  const [hasAnswered, setHasAnswered] = useState(false)

  const [selectedChoiceId, setSelectedChoiceId] = useState<string>()

  const [hasShownChoices, setHasShownChoices] = useState(false)

  useEffect(() => {
    setHasAnswered(false)
    setHasShownChoices(false)

    setTimeout(() => {
      setHasShownChoices(true)
    }, 1500)
  }, [question.id])

  const answer = async (choiceId: string) => {
    setHasAnswered(true)
    setSelectedChoiceId(choiceId)
    const { error } = await supabase.from('answers').insert({
      player_id: playerId,
      choice_id: choiceId,
      game_id: gameId,
      time: 100,
    })
    if (error) {
      setHasAnswered(false)
      return alert(error.message)
    }
  }

  return (
    <div>
      <div className="absolute left-4 top-4">
        {question.order + 1}/{questionCount}
      </div>
      <div className='flex flex-col gap-2'>
      <div dangerouslySetInnerHTML={{ __html: question.body }}></div>
      {hasShownChoices && (
        <div className="flex gap-2 flex-wrap">
          {question.choices?.map((choice) => (
            <div key={choice.id} className="">
              <button
                disabled={hasAnswered}
                onClick={() => answer(choice.id)}
                className={`p-2 text-left
              ${hasAnswered
                    ? selectedChoiceId == choice.id
                      ? choice.is_correct
                        ? 'bg-green-500'
                        : 'bg-red-500'
                      : choice.is_correct
                        ? 'bg-green-500'
                        : 'bg-gray-400'
                    : 'bg-gray-500'
                  }`}
              >
                <div dangerouslySetInnerHTML={{ __html: choice.body }}></div>
              </button>
            </div>

          ))}
        </div>
      )}
      </div>
      {!hasShownChoices && (
        <div className="text-center">
          <div role="status">
            <svg
              aria-hidden="true"
              className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-green-500"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}
    </div>
  )
}

function Lobby({ player }: { player: Player }) {
  return (
    <div>
      <h1 className="text-xl pb-4">Welcome {player.nickname}！</h1>
      <p>
        You have been registered and your nickname should show up on the admin
        screen. Please sit back and wait until the game master starts the game.
      </p>
    </div>
  )
}

function Register({
  gameId,
  onRegisterCompleted: onRegisterComplete,
}: {
  gameId: string,
  onRegisterCompleted: (player: Player) => void
}) {
  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSending(true)
    console.log(nickname)
    if (!nickname) {
      return
    }
    const { data: player, error } = await supabase
      .from('players')
      .insert({ nickname, game_id: gameId })
      .select()
      .single()

    if (error) {
      setSending(false)
      return alert(error.message)
    }

    onRegisterComplete(player)
  }

  const [nickname, setNickname] = useState('')
  const [sending, setSending] = useState(false)

  return (
    <form onSubmit={(e) => onFormSubmit(e)}>
      <input
        className="p-2 w-full border border-black text-black"
        type="text"
        onChange={(val) => setNickname(val.currentTarget.value)}
        placeholder="Nickname"
        maxLength={20}
      />
      <button disabled={sending} className="w-full py-2 bg-green-500 mt-4">
        Join
      </button>
    </form>
  )
}
