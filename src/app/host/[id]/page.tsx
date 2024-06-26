'use client'

import QRCode from '@/components/qr-code'
import {
  Answer,
  Choice,
  Player,
  Question,
  Game,
  supabase,
} from '@/types/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

enum AdminScreens {
  lobby,
  quiz,
  results,
}

export default function Home({
  params: { id: gameId },
}: {
  params: { id: string }
}) {
  const [currentScreen, setCurrentScreen] = useState<AdminScreens>(
    AdminScreens.lobby
  )

  const [players, setPlayers] = useState<Player[]>([])

  const [questions, setQuestions] = useState<Question[]>()

  useEffect(() => {
    getQuestions()
    setGameListner()
  }, [])

  const getQuestions = async () => {
    const { data, error } = await supabase
      .from("games")
      .select("*, quizes(*, questions(*, choices(*)))")
      .eq('id', gameId)
      .single()

    if (error) {
      return alert(error.message)
    }
    const quizQuestions = (data.quizes?.questions ?? []).sort((f, s) => f.order - s.order);
    setQuestions(quizQuestions);

    const choiceCount = quizQuestions.map((rows: Question) => rows.choices?.length)

    const correctCount = quizQuestions.map(
      (rows) =>
        rows.choices.filter((choice: Choice) => choice.is_correct).length
    )
  }

  const [currentQuestionSequence, setCurrentQuestionSequence] = useState(0)

  const setGameListner = () => {
    supabase
      .channel('game')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          setPlayers((currentPlayers) => {
            return [...currentPlayers, payload.new as Player]
          })
        }
      )
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
          setCurrentQuestionSequence(game.current_question_sequence)
          if (game.is_done) {
            setCurrentScreen(AdminScreens.results)
          } else {
            setCurrentScreen(AdminScreens.quiz)
          }
        }
      )
      .subscribe()
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-2 md:p-4 lg:p-12">
      <div className="m-auto p-8 bg-black  text-white">
        {currentScreen == AdminScreens.lobby && (
          <Lobby gameId={gameId} players={players}></Lobby>
        )}
        {currentScreen == AdminScreens.quiz && (
          <Quiz
            gameId={gameId}
            question={questions![currentQuestionSequence]}
            questionCount={questions!.length}
          ></Quiz>
        )}
        {currentScreen == AdminScreens.results && (
          <Results gameId={gameId} players={players!} questions={questions!}></Results>
        )}
      </div>
    </main>
  )
}

function Results({
  players,
  questions: questions,
  gameId
}: {
  gameId: string,
  players: Player[]
  questions: Question[]
}) {
  const [finalOrderedPlayers, setOrderedPlayers] = useState<
    {
      id: string
      correctCount: number
      player: Player
    }[]
  >([])

  const getResults = async () => {
    const { data, error } = await supabase.from('answers')
      .select()
      .eq("game_id", gameId);

    if (error) {
      return alert(error.message)
    }
    const answers = data as Answer[]

    const correctAnswers = answers.filter((answer) => {
      const targetQuestion = questions.find((question) => {
        return question.choices
          ?.map((choice) => choice.id)
          .includes(answer.choice_id)
      })
      if (!targetQuestion) return false

      const targetChoice = targetQuestion.choices?.find((choice) => {
        return choice.id == answer.choice_id
      })

      if (!targetChoice) return false
      return targetChoice.is_correct
    })

    const resultMap: { [key: string]: number } = {}
    correctAnswers.forEach((answer) => {
      if (!resultMap[answer.player_id]) {
        resultMap[answer.player_id] = 0
      }
      resultMap[answer.player_id]++
    })

    // const orderedPlayers = Object.keys(resultMap)
    const filteredPlayers = Object.keys(resultMap).filter((key) => {
      console.log({ players })
      const targetPlayer = players.find((player) => player.id == key)
      if (!targetPlayer) return false
      return true
    })

    const orderedPlayers = filteredPlayers
      .map((key) => {
        const targetPlayer = players.find((player) => player.id == key)
        return { id: key, correctCount: resultMap[key], player: targetPlayer! }
      })
      .sort((a, b) => a.correctCount - b.correctCount)

    setOrderedPlayers(orderedPlayers)
  }

  useEffect(() => {
    getResults()
  }, [])

  return (
    <div>
      <h1 className="text-xl pb-4">View Results！</h1>
      {finalOrderedPlayers.map((player, index) => (
        <div
          key={player.id}
          className="flex justify-between border-b-white border-b-2 py-2"
        >
          <div>{player.player?.nickname}</div>
          <div className="flex-grow"></div>
          <div>
            {player.correctCount}/{questions.length}
          </div>
        </div>
      ))}
    </div>
  )
}

function Quiz({
  gameId,
  question: question,
  questionCount: questionCount,
}: {
  gameId: string,
  question: Question
  questionCount: number
}) {
  const [hasShownAnswer, setHasShownAnswer] = useState(false)

  const [hasShownChoices, setHasShownChoices] = useState(false)

  const getNextQuestion = async () => {
    var updateData
    if (questionCount == question.order + 1) {
      updateData = { is_done: true }
    } else {
      updateData = { current_question_sequence: question.order + 1 }
    }

    const { data, error } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', gameId)

    if (error) {
      return alert(error.message)
    }
  }

  useEffect(() => {
    setHasShownAnswer(false)
    setHasShownChoices(false)

    setTimeout(() => {
      setHasShownChoices(true)
    }, 5)
  }, [question.id])

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
                <div
                  className={`p-2 
              ${hasShownAnswer
                      ? choice.is_correct
                        ? 'bg-green-500'
                        : 'bg-gray-400'
                      : 'bg-gray-500'
                    }`}
                >
                  <div dangerouslySetInnerHTML={{ __html: choice.body }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
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
      <div className="flex justify-between pt-4">
        <div></div>
        {!hasShownAnswer && (
          <button
            className="p-2 bg-white text-black"
            onClick={() => setHasShownAnswer(true)}
          >
            View Answer
          </button>
        )}
        {hasShownAnswer && (
          <button className="p-2 bg-white text-black" onClick={getNextQuestion}>
            Go to Next Question
          </button>
        )}
      </div>
    </div>
  )
}

function Lobby({ gameId, players }: { gameId: string, players: Player[] }) {
  const [basePath, setBasePath] = useState<string | null>(null)
  const onClickStartGame = async () => {
    const { data, error } = await supabase
      .from('games')
      .update({ has_started: true })
      .eq('id', gameId)
    if (error) {
      return alert(error.message)
    }
  }
  useEffect(() => {
    setBasePath(`${window.location.protocol}//${window.location.host}`)
  }, [gameId])



  return (
    <div className="flex justify-between">
      <div className="w-1/2">
        <div className="flex justify-start flex-wrap pb-4">
          {players.map((player) => (
            <div className="text-xl m-2 p-2 bg-green-500" key={player.id}>
              {player.nickname}
            </div>
          ))}
        </div>

        <button
          className="mx-auto bg-white py-4 px-12 block text-black"
          onClick={onClickStartGame}
        >
          Start Game
        </button>
      </div>
      <div className="w-1/2 flex flex-col gap-2">

        <QRCode data={`${basePath}/game/${gameId}`} width={400} />
        <Link className='self-end' href={`/game/${gameId}`} target='_blank' >Open players link</Link>

      </div>
    </div>
  )
}
