import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const cleanId = id.trim().toLowerCase();
  
  const mentorProfile = await prisma.mentorProfile.findFirst({
    where: {
      OR: [
        { id },
        { userId: id },
        { username: cleanId }
      ],
    },
    include: {
      user: {
        select: {
          name: true,
          avatar: true,
        },
      },
    },
  });

  if (!mentorProfile) {
    return {
      title: "Mentor Not Found | HelpSathi",
      description: "The mentor profile you are looking for does not exist.",
    };
  }

  const name = mentorProfile.user.name;
  const categories = mentorProfile.categories.join(", ");
  const title = `Book a Session with ${name} | HelpSathi Mentor`;
  const description = mentorProfile.bio 
    ? `${mentorProfile.bio.slice(0, 150)}...`
    : `Connect with ${name} on HelpSathi. Expert in ${categories}. Get personalized mentorship today.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://helpsathi.com/mentors/${id}`,
      images: mentorProfile.user.avatar ? [mentorProfile.user.avatar] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: mentorProfile.user.avatar ? [mentorProfile.user.avatar] : undefined,
    },
  };
}

export default async function MentorProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cleanId = id.trim().toLowerCase();
  
  const mentorProfile = await prisma.mentorProfile.findFirst({
    where: {
      OR: [
        { id },
        { userId: id },
        { username: cleanId }
      ],
    },
    include: {
      user: { select: { name: true, avatar: true } },
    }
  });

  const schema = mentorProfile ? {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": mentorProfile.user.name,
    "image": mentorProfile.user.avatar,
    "description": mentorProfile.bio,
    "jobTitle": "Mentor",
    "url": `https://helpsathi.com/mentors/${mentorProfile.username || mentorProfile.id}`
  } : null;

  return (
    <div className="w-full">
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      {children}
    </div>
  );
}
