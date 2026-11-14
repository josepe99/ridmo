import { Temporal } from '@js-temporal/polyfill';

export default function Footer() {
  const year = Temporal.Now.plainDateISO().year;

  return (
    <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
      <p className="text-xs text-gray-500 dark:text-gray-400">© {year} RIDMO. Todos los derechos reservados.</p>
    </footer>
  )
}
