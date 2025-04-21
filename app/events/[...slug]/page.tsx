'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChevronRight, Calendar, MapPin, DollarSign, Clock } from 'lucide-react'
import { use, useEffect, useState } from 'react'
import { readItems } from '@directus/sdk'
import directus from '@/lib/directus'
import { notFound } from 'next/navigation'

type post = {
  id: number
  title: string
  slug: string
  content: string
  short_description: string
  date_created: string
  image: string
  tags: string[]
  time: string
  location: string
  fee: string
  end_time: string
}

const fetchEvents = async (slug: string) => {
  try {
    return directus.request(
      readItems('events', {
        filter: { slug: { _eq: slug } },
      })
    )
  } catch {
    notFound()
  }
}

// Fetch events_tags
const fetchEventsTags = async () => {
  return directus.request(readItems('events_tags'))
}

// Fetch tags
const fetchTags = async () => {
  return directus.request(readItems('tags'))
}

// Fetch events data with tags
const fetchEventsWithTags = async (slug: string) => {
  try {
    const [events, eventsTags, tags] = await Promise.all([
      fetchEvents(slug),
      fetchEventsTags(),
      fetchTags(),
    ])

    // Map tags to their corresponding tag strings
    const tagMap = tags.reduce((acc: Record<number, string>, tag: any) => {
      acc[tag.id] = tag.tag
      return acc
    }, {})

    // Map events_tags to events items
    const eventsWithTags = events.map((item: any) => {
      const relatedTags = eventsTags
        .filter((eventsTag: any) => eventsTag.events_id === item.id)
        .map((eventsTag: any) => tagMap[eventsTag.tags_id] || '')

      return {
        ...item,
        tags: relatedTags.filter(Boolean), // Remove empty tags
      }
    })

    return eventsWithTags
  } catch (err) {
    console.error('Error fetching events with tags:', err)
    return []
  }
}

export default function SinglePost({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const slugValue = Array.isArray(slug) ? slug[0] : slug
  const [postData, setPostData] = useState<post>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const events = await fetchEventsWithTags(slugValue)
        if (events.length === 0) {
          notFound()
        } else {
          setPostData(events[0])
        }
      } catch (err) {
        console.error('Error fetching post data:', err)
        setError('Failed to load post data.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slugValue])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!postData) {
    notFound()
  }

  const {
    title,
    content,
    tags,
    date_created,
    image,
    short_description,
    time,
    location,
    fee,
    end_time,
  } = postData as post

  const generateGoogleCalendarUrl = () => {
    // Parse event start/end dates
    const startDate = new Date(postData.time)
    const endDate = new Date(postData.end_time)

    // Format dates for Google Calendar
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '')
    }

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: postData.title,
      //details: postData.description,
      location: postData.location,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    })

    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  return (
    <main className='relative min-h-screen w-full'>
      <div className='relative w-full h-[70vh]'>
        <Image
          src={
            `${process.env.NEXT_PUBLIC_URL}/assets/${image}` ||
            '/placeholder.svg'
          }
          alt={title}
          fill
          priority
          className='object-cover blur-[8px]'
        />
        <div className='absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6'>
          <div className='max-w-4xl w-full flex flex-col items-center gap-6'>
            {/* Breadcrumbs centered above the title */}
            <nav className='flex items-center text-sm text-white/90'>
              <Link
                href='/'
                className='hover:text-white transition-colors'>
                Home
              </Link>
              <ChevronRight className='h-4 w-4 mx-2' />
              <Link
                href='/events'
                className='hover:text-white transition-colors'>
                Events
              </Link>
              <ChevronRight className='h-4 w-4 mx-2' />
              <span className='text-white/70'>{title}</span>
            </nav>

            {/* Title */}
            <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center'>
              {title}
            </h1>

            {/* Posted date */}
            <div className='text-white/90 text-sm'>
              {new Date(date_created).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>

            {/* Tags */}
            <div className='flex flex-wrap gap-2 justify-center'>
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className='px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white hover:bg-white/30 transition-colors cursor-pointer'>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content card that overlaps the image */}
      <div className='relative mx-auto max-w-4xl px-4 sm:px-6 -mt-24'>
        <motion.div
          className='dark:bg-slate-900 bg-slate-100 rounded-lg shadow-xl p-4 mb-4'
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.1,
          }}>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center text-sm '>
                <Calendar className='h-4 w-4 mr-2' />
                <span>
                  {time.split('T')[0].split('-').join('/')} -{' '}
                  {end_time.split('T')[0].split('-').join('/')}
                </span>
                <Clock className='h-4 w-4 ml-4 mr-2' />
                <span>
                  {time.split('T')[1].split(':').slice(0, 2).join(':')} -{' '}
                  {end_time.split('T')[1].split(':').slice(0, 2).join(':')}
                </span>
              </div>
              <div className='flex items-center text-sm'>
                <MapPin className='h-4 w-4 mr-2' />
                <span>{location}</span>
              </div>
              <div className='flex items-center text-sm'>
                <DollarSign className='h-4 w-4 mr-2' />
                <span>{fee}</span>
              </div>
            </div>
            <a
              href={generateGoogleCalendarUrl()}
              target='_blank'
              rel='noopener noreferrer'
              className='bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center'>
              <Calendar className='h-4 w-4 mr-2' />
              Add to Calendar
            </a>
          </div>
        </motion.div>

        <motion.div
          className='dark:bg-slate-900 bg-slate-100 rounded-lg shadow-[0_0_25px_rgba(0,0,0,0.15)] p-6 md:p-8 lg:p-10'
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.2,
          }}>
          <div className='prose max-w-none'>
            <p className='lead text-lg  mb-6'>{short_description}</p>

            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </motion.div>
      </div>
    </main>
  )
}
