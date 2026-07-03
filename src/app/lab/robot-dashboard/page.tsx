import type { Metadata } from 'next'
import RobotDashboard from '@/components/lab/robot-dashboard/RobotDashboard'

export const metadata: Metadata = {
  title: 'ITMAN Portal — náhled nového rozhraní',
  description:
    'Interaktivní náhled redesignu intranetového portálu ITMAN s 3D maskotem.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <RobotDashboard />
}
