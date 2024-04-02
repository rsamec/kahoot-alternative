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
        <button key={d.id} disabled={sending} className="p-2 bg-black text-white" 
          onClick={() => onClickNewGame(d.id)}>
            {d.code} - ({d.questions?.length ?? 0})
        </button>)
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
