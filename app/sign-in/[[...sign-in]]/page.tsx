import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-black hover:bg-gray-800 text-sm normal-case',
              card: 'shadow-lg',
              headerTitle: 'text-gray-900',
              socialButtonsBlockButton: 'border border-gray-200',
            }
          }}
        />
      </div>
    </div>
  )
}
