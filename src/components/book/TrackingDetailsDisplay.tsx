'use client'

import { AcquisitionMethod, RepresentationValue } from '@/types/book'

interface TrackingDetailsDisplayProps {
  acquisitionMethod?: string | null
  acquisitionOther?: string | null
  bookClubName?: string | null
  readathonName?: string | null
  isReread?: boolean | null
  dnfReason?: string | null
  lgbtqRepresentation?: string | null
  lgbtqDetails?: string | null
  disabilityRepresentation?: string | null
  disabilityDetails?: string | null
  isNewAuthor?: boolean | null
  authorPoc?: string | null
  authorPocDetails?: string | null
}

export default function TrackingDetailsDisplay(props: TrackingDetailsDisplayProps) {
  const hasTrackingData = props.acquisitionMethod || props.bookClubName || props.readathonName || props.isReread
  const hasRepresentationData = props.lgbtqRepresentation || props.disabilityRepresentation || props.isNewAuthor || props.authorPoc

  if (!hasTrackingData && !hasRepresentationData && !props.dnfReason) {
    return null
  }

  return (
    <div className="space-y-4 text-sm">
      {/* DNF Reason */}
      {props.dnfReason && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">DNF Reason</h4>
          <p className="text-yellow-800 dark:text-yellow-200">{props.dnfReason}</p>
        </div>
      )}

      {/* Tracking Information */}
      {hasTrackingData && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">Tracking Details</h4>

          {props.acquisitionMethod && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Acquired:</span>
              <span className="text-gray-900 dark:text-gray-100">
                {props.acquisitionMethod === AcquisitionMethod.Other && props.acquisitionOther
                  ? props.acquisitionOther
                  : props.acquisitionMethod.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          )}

          {props.bookClubName && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Book Club:</span>
              <span className="text-gray-900 dark:text-gray-100">{props.bookClubName}</span>
            </div>
          )}

          {props.readathonName && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Readathon:</span>
              <span className="text-gray-900 dark:text-gray-100">{props.readathonName}</span>
            </div>
          )}

          {props.isReread && (
            <div className="flex items-center gap-2">
              <span className="text-orange-600 dark:text-orange-400">📖 Re-read</span>
            </div>
          )}
        </div>
      )}

      {/* Representation Information */}
      {hasRepresentationData && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">Representation</h4>

          {props.lgbtqRepresentation && props.lgbtqRepresentation !== RepresentationValue.Unknown && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">LGBTQ+:</span>
                <span className={props.lgbtqRepresentation === RepresentationValue.Yes ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                  {props.lgbtqRepresentation}
                </span>
              </div>
              {props.lgbtqRepresentation === RepresentationValue.Yes && props.lgbtqDetails && (
                <p className="text-gray-600 dark:text-gray-400 ml-4 text-xs">{props.lgbtqDetails}</p>
              )}
            </div>
          )}

          {props.disabilityRepresentation && props.disabilityRepresentation !== RepresentationValue.Unknown && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Disability:</span>
                <span className={props.disabilityRepresentation === RepresentationValue.Yes ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                  {props.disabilityRepresentation}
                </span>
              </div>
              {props.disabilityRepresentation === RepresentationValue.Yes && props.disabilityDetails && (
                <p className="text-gray-600 dark:text-gray-400 ml-4 text-xs">{props.disabilityDetails}</p>
              )}
            </div>
          )}

          {props.isNewAuthor && (
            <div className="flex items-center gap-2">
              <span className="text-purple-600 dark:text-purple-400">✨ New Author</span>
            </div>
          )}

          {props.authorPoc && props.authorPoc !== RepresentationValue.Unknown && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Author POC:</span>
                <span className={props.authorPoc === RepresentationValue.Yes ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                  {props.authorPoc}
                </span>
              </div>
              {props.authorPoc === RepresentationValue.Yes && props.authorPocDetails && (
                <p className="text-gray-600 dark:text-gray-400 ml-4 text-xs">{props.authorPocDetails}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}