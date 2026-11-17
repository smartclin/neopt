// src/routes/_auth/app/route.tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";
import React from "react";

import { installOutboxFlusher } from "#/features/outbox/flusher.ts";
import { ConnectionBanner } from "#/features/outbox/ui/connection-banner.tsx";
import { AppShell } from "@/components/blocks/app-shell-1";

export const Route = createFileRoute("/_auth/app")({
  component: AppLayout,
});

function AppLayout() {
  React.useEffect(() => {
    const cleanup = installOutboxFlusher();
    return cleanup;
  }, []);
  return (
    <AppShell>
      <ConnectionBanner />
      <Outlet />
    </AppShell>
  );
}
// import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
// import {
// 	CalendarClockIcon,
// 	ClipboardListIcon,
// 	LayoutDashboardIcon,
// 	MenuIcon,
// 	StethoscopeIcon,
// 	SyringeIcon,
// 	UsersIcon
// } from "lucide-react";
// import * as React from "react";

// import { SignOutButton } from "#/components/sign-out-button.tsx";
// import { ThemeToggle } from "#/components/theme-toggle.tsx";
// import { Button } from "#/components/ui/button.tsx";
// import {
// 	Sheet,
// 	SheetContent,
// 	SheetHeader,
// 	SheetTitle,
// 	SheetTrigger
// } from "#/components/ui/sheet.tsx";

// export const Route = createFileRoute("/_auth/app")({
// 	component: AppLayout
// });

// const NAV_ITEMS = [
// 	{ label: "Dashboard", icon: LayoutDashboardIcon, to: "/app" },
// 	{ label: "Patients", icon: UsersIcon, to: "/app/patients" },
// 	{ label: "Appointments", icon: CalendarClockIcon, to: "/app/appointments" },
// 	{ label: "Visits", icon: ClipboardListIcon, to: "/app/visits" },
// 	{ label: "Prescriptions", icon: SyringeIcon, to: "/app/prescriptions" },
// 	{ label: "Clinics", icon: StethoscopeIcon, to: "/app/clinics" }
// ] as const;

// function AppLayout() {
// 	const [openMobile, setOpenMobile] = React.useState(false);

// 	return (
// 		<div className='flex min-h-svh w-full bg-zinc-50/50 dark:bg-zinc-950/50'>
// 			{/* ── Sidebar (Desktop) ──────────────────────────────────────── */}
// 			<aside className='bg-background sticky top-0 hidden h-svh w-64 flex-col border-r md:flex'>
// 				<div className='flex h-14 items-center border-b px-6'>
// 					<Link
// 						className='flex items-center gap-2 font-bold tracking-tight'
// 						to='/app'
// 					>
// 						<StethoscopeIcon className='text-primary size-5' />
// 						<span>Pediatric Clinic</span>
// 					</Link>
// 				</div>
// 				<nav className='flex flex-1 flex-col gap-1 overflow-y-auto p-4'>
// 					{NAV_ITEMS.map(item => (
// 						<Link
// 							activeProps={{
// 								className: "bg-primary/10 text-primary hover:bg-primary/15"
// 							}}
// 							className='flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors'
// 							inactiveProps={{
// 								className:
// 									" hover:bg-muted/50 hover:text-foreground"
// 							}}
// 							key={item.to}
// 							to={item.to}
// 						>
// 							<item.icon className='size-4' />
// 							{item.label}
// 						</Link>
// 					))}
// 				</nav>
// 				<div className='border-t p-4'>
// 					<SignOutButton className=' hover:text-foreground w-full justify-start gap-3' />
// 				</div>
// 			</aside>

// 			{/* ── Main Content Area ──────────────────────────────────────── */}
// 			<div className='flex min-w-0 flex-1 flex-col'>
// 				{/* Topbar */}
// 				<header className='bg-background/80 sticky top-0 z-10 flex h-14 items-center justify-between border-b px-4 backdrop-blur-md sm:px-6'>
// 					<div className='flex items-center gap-2 md:hidden'>
// 						<Sheet
// 							onOpenChange={setOpenMobile}
// 							open={openMobile}
// 						>
// 							<SheetTrigger
// 								render={
// 									<Button
// 										className='md:hidden'
// 										size='icon-sm'
// 										variant='ghost'
// 									/>
// 								}
// 							>
// 								<MenuIcon className='size-5' />
// 								<span className='sr-only'>Open navigation menu</span>
// 							</SheetTrigger>
// 							<SheetContent
// 								className='flex w-72 flex-col justify-between '
// 								side='left'
// 							>
// 								<div>
// 									<SheetHeader className='border-b px-6 py-4'>
// 										<SheetTitle className='flex items-center gap-2 text-base font-bold'>
// 											<StethoscopeIcon className='text-primary size-5' />
// 											<span>Pediatric Clinic</span>
// 										</SheetTitle>
// 									</SheetHeader>
// 									<nav className='flex flex-col gap-1 p-4'>
// 										{NAV_ITEMS.map(item => (
// 											<Link
// 												activeProps={{
// 													className:
// 														"bg-primary/10 text-primary hover:bg-primary/15"
// 												}}
// 												className='flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors'
// 												inactiveProps={{
// 													className:
// 														" hover:bg-muted/50 hover:text-foreground"
// 												}}
// 												key={item.to}
// 												onClick={() => setOpenMobile(false)}
// 												to={item.to}
// 											>
// 												<item.icon className='size-4' />
// 												{item.label}
// 											</Link>
// 										))}
// 									</nav>
// 								</div>
// 								<div className='border-t p-4'>
// 									<SignOutButton className=' hover:text-foreground w-full justify-start gap-3' />
// 								</div>
// 							</SheetContent>
// 						</Sheet>

// 						<Link
// 							className='flex items-center gap-2 font-bold tracking-tight'
// 							to='/app'
// 						>
// 							<StethoscopeIcon className='text-primary size-5' />
// 							<span>Pediatric Clinic</span>
// 						</Link>
// 					</div>

// 					<div className='hidden md:block'>{/* Desktop context */}</div>

// 					<div className='flex items-center gap-2'>
// 						<ThemeToggle />
// 					</div>
// 				</header>

// 				{/* Page Content */}
// 				<main className='flex-1 p-4 sm:p-6 lg:p-8'>
// 					<div className='mx-auto w-full max-w-7xl'>
// 						<Outlet />
// 					</div>
// 				</main>
// 			</div>
// 		</div>
// 	);
// }
