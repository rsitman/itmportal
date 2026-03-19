'use client'

import React from 'react'

interface SekceDashboarduProps {
  title: string
  children: React.ReactNode
  className?: string
  id?: string
  action?: React.ReactNode
}

export default function SekceDashboardu({ title, children, className = '', id, action }: SekceDashboarduProps) {
  return (
    <section id={id} className={className}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="card-professional rounded-lg p-4 md:p-5">{children}</div>
    </section>
  )
}
