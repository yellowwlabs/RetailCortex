import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center">
            <span className="text-white font-bold text-xs">RC</span>
          </div>
          <span className="font-semibold text-white tracking-tight text-lg">RetailCortex</span>
        </div>
        <p className="text-zinc-500 text-sm">Create your account</p>
      </div>
      <SignUp />
    </main>
  );
}
