# Verbfy Frontend (Next.js + MVVM)

## Project Structure

```
verbfy-app/
├── pages/                # Next.js route pages (student, teacher, rooms, etc.)
├── src/
│   ├── features/         # MVVM feature modules (auth, reservation, materials, etc.)
│   │   └── ...
│   ├── components/       # Shared/presentational components
│   ├── context/          # React context providers (e.g., AuthContext)
│   ├── layouts/          # Layout components (e.g., DashboardLayout)
│   ├── lib/              # Utilities (api, toast, withAuth, etc.)
│   └── store/            # (Optional) Global state (Zustand, etc.)
├── styles/               # Global styles (Tailwind, etc.)
├── public/               # Static assets
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript config (with @ alias for src/)
└── ...
```

## Conventions
- **MVVM:** Each feature has its own model, viewmodel, and (optionally) view folder.
- **@ Alias:** Use `@/` to import from `src/` (e.g., `import { useAuthContext } from '@/context/AuthContext'`).
- **Accessibility:** All components should use semantic HTML, ARIA labels, and keyboard navigation.
- **State:** Use context or Zustand for global state, colocate feature state in viewmodels.
- **Styling:** Use Tailwind CSS utility classes, no inline styles.

## Running the App
```bash
cd verbfy-app
npm install
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

## Adding Features
- Add new features under `src/features/featureName/`.
- Add new pages under `pages/`.
- Add shared components under `src/components/`.

## Deployment
- Use Vercel, Netlify, or your preferred Next.js host.

---
**For questions, see the codebase or contact the maintainers.**
