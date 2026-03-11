'use client'

import React from 'react'

interface SekceDashboarduProps {
  title: string
  children: React.ReactNode
  className?: string
  id?: string
}

export default function SekceDashboardu({ title, children, className = '', id }: SekceDashboarduProps) {
  return (
    <section id={id} className={className}>
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      <div className="card-professional rounded-lg p-4 md:p-5">{children}</div>
    </section>
  )
}
