import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className='grid min-h-screen grid-cols-1 lg:grid-cols-2'>
      <div className='flex flex-col items-center justify-center px-4 py-8 text-center'>
        <h2 className='mb-6 text-5xl font-semibold'>404</h2>
        <h3 className='mb-1.5 text-3xl font-semibold'>Page not found</h3>
        <p className='text-muted-foreground mb-6 max-w-sm'>
          The page you&apos;re looking for isn&apos;t found. It might have been moved or doesn&apos;t exist.
        </p>
        <Button asChild size='lg' className='rounded-lg text-base'>
          <Link href='/'>Back to home page</Link>
        </Button>
      </div>

      <div className='relative flex h-[400px] max-h-screen w-full p-2 lg:h-full'>
        <div className='h-full w-full rounded-2xl bg-black'></div>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/error/image-1.png'
          alt='404 illustration'
          className='absolute top-1/2 left-1/2 h-[clamp(200px,40vw,406px)] -translate-x-1/2 -translate-y-1/2 lg:h-[clamp(260px,25vw,406px)]'
        />
      </div>
    </div>
  )
}
