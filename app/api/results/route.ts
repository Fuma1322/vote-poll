import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type DemoCandidate = {
  id: string;
  fullName: string;
  votes: number;
};

type DemoCategory = {
  role: 'DOCTOR' | 'PHARMACIST' | 'DENTIST';
  title: string;
  candidates: DemoCandidate[];
};

// Demo data only. Replace these names with your actual candidates.
const categories: DemoCategory[] = [
  {
    role: 'DOCTOR',
    title: 'Doctors',
    candidates: [
      { id: 'doctor-1', fullName: 'Dr. Mabela Lehloenya', votes: 55 },
      { id: 'doctor-2', fullName: 'Dr. Thato Ramokotjo', votes: 40 },
      { id: 'doctor-3', fullName: 'Dr. Neo Mokoena', votes: 25 },
    ],
  },
  {
    role: 'PHARMACIST',
    title: 'Pharmacists',
    candidates: [
      { id: 'pharmacist-1', fullName: 'Pharm. Lerato Molefe', votes: 30 },
      { id: 'pharmacist-2', fullName: 'Pharm. Palesa Thabane', votes: 35 },
      { id: 'pharmacist-3', fullName: 'Pharm. Kabelo Rantso', votes: 25 },
    ],
  },
  {
    role: 'DENTIST',
    title: 'Dentists',
    candidates: [
      { id: 'dentist-1', fullName: 'Dr. Teboho Ndlovu', votes: 20 },
      { id: 'dentist-2', fullName: 'Dr. Lineo Phakoe', votes: 25 },
      { id: 'dentist-3', fullName: 'Dr. Khotso Mota', votes: 15 },
    ],
  },
];

// Store simulated state between requests handled by this module.
let lastSimulationTime = Date.now();
let simulationStep = 0;

export async function GET() {
  const now = Date.now();
  const secondsElapsed = Math.floor((now - lastSimulationTime) / 15000);

  // Simulate one additional vote every 15 seconds.
  // This is only for frontend demonstration, not real election data.
  if (secondsElapsed > 0) {
    for (let step = 0; step < secondsElapsed; step++) {
      const categoryIndex = simulationStep % categories.length;
      const category = categories[categoryIndex];

      const candidateIndex =
        Math.floor(simulationStep / categories.length) % category.candidates.length;

      category.candidates[candidateIndex].votes += 1;
      simulationStep += 1;
    }

    lastSimulationTime += secondsElapsed * 15000;
  }

  const results = {
    categories: categories.map((category) => ({
      ...category,
      candidates: category.candidates.map((candidate) => ({ ...candidate })),
      totalVotes: category.candidates.reduce((sum, candidate) => sum + candidate.votes, 0),
    })),
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
