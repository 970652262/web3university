import { Card, CardContent, CardFooter } from "@/components/ui/Card";

export function CourseCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      {/* Cover skeleton */}
      <div className="aspect-video bg-muted animate-pulse" />

      <CardContent className="p-4">
        {/* Title skeleton */}
        <div className="h-6 bg-muted rounded animate-pulse mb-2" />
        <div className="h-6 bg-muted rounded animate-pulse w-2/3 mb-3" />

        {/* Description skeleton */}
        <div className="h-4 bg-muted rounded animate-pulse mb-1" />
        <div className="h-4 bg-muted rounded animate-pulse w-4/5 mb-3" />

        {/* Instructor skeleton */}
        <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        {/* Rating skeleton */}
        <div className="h-4 bg-muted rounded animate-pulse w-16" />

        {/* Price skeleton */}
        <div className="h-5 bg-muted rounded animate-pulse w-20" />
      </CardFooter>
    </Card>
  );
}
