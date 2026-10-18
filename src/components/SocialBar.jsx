const socialLinks = [
  {
    href: 'https://rahulbaradol.in',
    icon: '/social/me.svg',
    alt: 'Portfolio',
  },
  {
    href: 'https://github.com/Rahul-Baradol/Flow-Puzzle-Solver-React',
    icon: '/social/github.png',
    alt: 'GitHub',
  },
  {
    href: 'https://www.linkedin.com/in/rahul-baradol-22723b289/',
    icon: '/social/linkedin2.png',
    alt: 'LinkedIn',
  },
];

export default function SocialBar() {
  return (
    <div className="absolute top-5 right-5 z-40 flex flex-col gap-3 rounded-full border-2 border-ink bg-card px-2 py-3 shadow-[3px_3px_0_0_var(--color-ink)]">
      {socialLinks.map((link) => (
        <a
          key={link.alt}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.alt}
          className="flex h-fit w-fit items-center justify-center overflow-hidden rounded-full opacity-60 grayscale transition-all hover:scale-110 hover:opacity-100 hover:grayscale-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <img src={link.icon} alt={link.alt} className="h-auto w-6 object-cover md:w-7" />
        </a>
      ))}
    </div>
  );
}
