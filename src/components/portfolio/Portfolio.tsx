import React from 'react';
import { Mail, MapPin, Briefcase, GraduationCap, Monitor } from 'lucide-react';

export function Portfolio() {
  return (
    <div className="p-10 bg-[#0a0c10] text-neutral-200 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-12">
        <header>
          <div>
            <h1 className="text-4xl font-bold text-white">Shaurya Rajan Joshi</h1>
            <p className="text-emerald-400 text-lg font-medium">Owner & Founder, Earthin</p>
            <p className="mt-4 text-neutral-400 max-w-lg">
              A passionate developer and designer currently in Class 9, dedicated to building the digital future through innovative software solutions and premium design.
            </p>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-surface border border-border-dark rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Monitor className="w-6 h-6 text-emerald-500" />
              <h2 className="text-xl font-bold text-white">The Vision</h2>
            </div>
            <p className="text-neutral-400 text-sm">
              Founded Earthin with a vision to provide top-tier digital services. Specializing in web development, UI/UX design, and creating seamless digital experiences that help businesses grow in the modern era.
            </p>
          </div>

          <div className="p-6 bg-surface border border-border-dark rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Briefcase className="w-6 h-6 text-emerald-500" />
              <h2 className="text-xl font-bold text-white">Expertise</h2>
            </div>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>• Full-Stack Web Development</li>
              <li>• UI/UX Design & Prototyping</li>
              <li>• React, TypeScript, Tailwind CSS</li>
            </ul>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-surface border border-border-dark rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap className="w-6 h-6 text-emerald-500" />
              <h2 className="text-xl font-bold text-white">Background</h2>
            </div>
            <p className="text-neutral-400 text-sm">
              Currently studying in Class 9, balancing academics with a deep passion for technology and entrepreneurship. Constantly learning and adapting to new technologies to stay ahead in the fast-paced tech world.
            </p>
          </div>

          <div className="p-6 bg-surface border border-border-dark rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-6 h-6 text-emerald-500" />
              <h2 className="text-xl font-bold text-white">Connect</h2>
            </div>
            <div className="space-y-3 text-sm text-neutral-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>hishaurya12h@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>India</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
