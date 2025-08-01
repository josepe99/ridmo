import { UserProfile } from '@clerk/nextjs'

export default function ProfilePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-4xl">
        <UserProfile 
          appearance={{
            elements: {
              card: 'shadow-lg',
              navbar: 'bg-white',
              navbarButton: 'text-gray-600 hover:text-gray-900',
              navbarButtonActive: 'text-black border-b-2 border-black',
            }
          }}
        />
      </div>
    </div>
  )
}
