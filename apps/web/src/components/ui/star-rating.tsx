import { Star, StarHalf } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  max?: number;
  className?: string;
  starClassName?: string;
}

export function StarRating({ rating, max = 5, className, starClassName }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = max - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-0.5 text-brand-500", className)}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} weight="fill" className={starClassName} />
      ))}
      {hasHalfStar && <StarHalf weight="fill" className={starClassName} />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className={cn("text-slate-300", starClassName)} />
      ))}
    </div>
  );
}
