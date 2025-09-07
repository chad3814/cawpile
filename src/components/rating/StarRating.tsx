'use client'

import { convertToStars, getStarEmojis } from '@/types/cawpile'

interface StarRatingProps {
  rating: number | null
  showAverage?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function StarRating({
  rating,
  showAverage = false,
  size = 'md',
  className = ''
}: StarRatingProps) {
  if (rating === null || rating === 0) {
    return (
      <span className={`text-gray-400 ${getSizeClass(size)} ${className}`}>
        Not rated
      </span>
    )
  }

  const stars = convertToStars(rating)
  const starEmojis = getStarEmojis(stars)

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <span className={`${getSizeClass(size)}`}>
        {starEmojis || '☆☆☆☆☆'}
      </span>
      {showAverage && (
        <span className={`${getAverageSizeClass(size)} text-gray-600 dark:text-gray-400`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

function getSizeClass(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'text-sm'
    case 'lg':
      return 'text-xl'
    default:
      return 'text-base'
  }
}

function getAverageSizeClass(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'text-xs'
    case 'lg':
      return 'text-lg'
    default:
      return 'text-sm'
  }
}