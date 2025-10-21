'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';
import { motion } from 'framer-motion';
import { User, Map, Calendar, Bell, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const { currentUser, isAdmin, isBarangayAdmin, barangayAdminData } = useAuth();
	const [profileSrc, setProfileSrc] = useState('/assets/default-avatar.png');
	const pathname = usePathname();
	const router = useRouter();

	// Redirect barangay admins to their proper dashboard
	useEffect(() => {
		if (typeof isBarangayAdmin !== 'undefined' && isBarangayAdmin) {
			router.replace('/barangay-admin');
		}
	}, [isBarangayAdmin, router]);

	useEffect(() => {
		// update profileSrc whenever the currentUser changes
		if (currentUser?.photoURL) {
			setProfileSrc(currentUser.photoURL);
		} else {
			setProfileSrc('/assets/default-avatar.png');
		}
	}, [currentUser]);

	const handleLogout = async () => {
		await logout();
		window.location.href = '/';
	};

	const handleImageError = () => {
		setProfileSrc('/assets/default-avatar.png');
	};

	const linkClass = (path: string) =>
		`flex items-center gap-2 p-2 rounded-md transition ${
			pathname === path
				? 'bg-green-100 text-green-700 font-semibold'
				: 'text-gray-700 hover:text-green-600 hover:bg-green-50'
		}`;

	return (
		<div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-green-100">
			<div className="flex flex-1 p-6">
				{/* Sidebar */}
				<motion.aside
					initial={{ x: -50, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					transition={{ duration: 0.5 }}
					className="w-1/5 bg-white rounded-2xl shadow-md p-5 flex flex-col justify-between"
				>
					<div>
						{/* Profile Section */}
						<div className="flex flex-col items-center mb-6">
							<div className="relative w-20 h-20 mb-3">
								<Image
									src={profileSrc}
									alt="Profile"
									fill
									className="rounded-full border-2 border-green-300 object-cover"
									onError={handleImageError}
								/>
							</div>
							<h2 className="font-semibold text-gray-800">
								{currentUser?.displayName || 'Guest'}
							</h2>
							{isAdmin ? (
								<div className="flex items-center gap-2 mt-1">
									<span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
										Administrator
									</span>
									<span className="text-sm text-gray-500">Kapangan Wonders</span>
								</div>
							) : isBarangayAdmin ? (
								<div className="flex flex-col items-center gap-1 mt-1">
									<span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
										Barangay Admin
									</span>
									<span className="text-sm text-gray-600 font-medium">
										{barangayAdminData?.barangayName || barangayAdminData?.displayName || 'Barangay'}
									</span>
								</div>
							) : (
								<p className="text-sm text-gray-500">Tourist</p>
							)}
						</div>

						{/* Navigation Sections */}
						<div className="space-y-6">
							<div>
								<p className="text-xs font-semibold text-gray-500 uppercase mb-2">Account</p>
								<ul className="space-y-2">
									<li>
										<Link href="/dashboard" className={linkClass('/dashboard')}>
											<LayoutDashboard size={18} />
											Overview
										</Link>
									</li>
									<li>
										<Link href="/dashboard/profile" className={linkClass('/dashboard/profile')}>
											<User size={18} />
											Profile
										</Link>
									</li>
								</ul>
							</div>

							<div>
								<p className="text-xs font-semibold text-gray-500 uppercase mb-2">Travel</p>
								<ul className="space-y-2">
									<li>
										<Link href="/dashboard/my-travels" className={linkClass('/dashboard/my-travels')}>
											<Map size={18} />
											My Travels
										</Link>
									</li>
									<li>
										<Link href="/dashboard/places-visited" className={linkClass('/dashboard/places-visited')}>
											<Map size={18} />
											Places Visited
										</Link>
									</li>
									<li>
										<Link href="/dashboard/schedule-visit" className={linkClass('/dashboard/schedule-visit')}>
											<Calendar size={18} />
											Schedule Visit
										</Link>
									</li>
								</ul>
							</div>

							<div>
								<p className="text-xs font-semibold text-gray-500 uppercase mb-2">Updates</p>
								<ul className="space-y-2">
									<li>
										<Link href="#" className="flex items-center gap-2 text-gray-700 hover:text-green-600">
											<Bell size={18} />
											Announcements
										</Link>
									</li>
								</ul>
							</div>

							{isAdmin && (
								<div>
									<p className="text-xs font-semibold text-gray-500 uppercase mb-2">Admin</p>
									<ul className="space-y-2">
										<li>
											<Link href="/dashboard/admin/users" className={linkClass('/dashboard/admin/users')}>
												<User size={18} />
												Manage Users
											</Link>
										</li>
										<li>
											<Link href="/dashboard/admin/places" className={linkClass('/dashboard/admin/places')}>
												<Map size={18} />
												Manage Places
											</Link>
										</li>
										<li>
											<Link href="/dashboard/admin/announcements" className={linkClass('/dashboard/admin/announcements')}>
												<Bell size={18} />
												Manage Announcements
											</Link>
										</li>
									</ul>
								</div>
							)}
						</div>
					</div>

					<div className="mt-auto">
						{isAdmin && (
							<div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
								<p className="text-sm font-medium text-yellow-800">Admin Mode</p>
								<p className="text-xs text-yellow-600">You have administrator privileges</p>
							</div>
						)}
						<button
							onClick={handleLogout}
							className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
						>
							<LogOut size={18} />
							Logout
						</button>
					</div>
				</motion.aside>

				{/* Main Dashboard */}
				<main className="flex-1 bg-white rounded-2xl shadow-md ml-6 p-6">{children}</main>
			</div>
		</div>
	);
}
