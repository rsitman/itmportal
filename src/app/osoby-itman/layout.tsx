import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Osoby ITMAN',
  description: 'Seznam aktuálně platných osob ITMAN a kontakty',
}

export default function OsobyItmanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
