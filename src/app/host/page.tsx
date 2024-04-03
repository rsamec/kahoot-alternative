'use client'

import { Game, Quiz, supabase } from "@/types/types"
import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'

export default function Home() {

  const router = useRouter()
  useEffect(() => {
    getQuizes()
  }, [])

  const [quizes, setQuizes] = useState<Quiz[]>([])
  const [sending, setSending] = useState(false);

  const getQuizes = async () => {
    const { data, error } = await supabase
      .from('quizes')
      .select(`*, questions(*)`)
      .order('created_at', { ascending: true })

    if (error) {
      return alert(error.message)
    }

    setQuizes(data)
  }
  const onClickNewGame = async (quizId: string) => {
    setSending(true)
    const { data: games, error } = await supabase
      .from('games')
      .insert({ quiz_id: quizId })
      .select()
      .single()

    if (error) {
      setSending(false)
      return alert(error.message)
    }
    console.log(games.id);
    router.push(`/host/${games.id}`);
  }


  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-12">
      <div className="max-w-2xl flex gap-2 flex-wrap items-center ">
        {
          quizes.map(d =>
            <div key={d.id} className="max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{d.name}</h5>
              <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">{d.code} - {d.questions?.length ?? 0} úloh.</p>
              <button disabled={sending} onClick={() => onClickNewGame(d.id)} className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                nová hra
                <svg className="rtl:rotate-180 w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                </svg>
              </button>
            </div>)
        }
      </div>
    </main>
  )
}

// export async function generateStaticParams() {
//   return [];  
//   // const posts = getDocumentSlugs(collection)
//   // return posts.map((slug) => ({ slug }))
// }
