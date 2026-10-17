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
    <div className="absolute top-5 right-5 z-40 flex flex-col gap-4 rounded-full border border-white/30 bg-black/20 px-3 py-4 backdrop-blur-md">
      {socialLinks.map((link) => (
        <a
          key={link.alt}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.alt}
          className="flex h-fit w-fit items-center justify-center overflow-hidden rounded-full border-2 border-violet-600 bg-black/20 opacity-50 transition-opacity hover:opacity-100"
        >
          <img src={link.icon} alt={link.alt} className="h-auto w-6 object-cover md:w-8" />
        </a>
      ))}
    </div>
  );
}
