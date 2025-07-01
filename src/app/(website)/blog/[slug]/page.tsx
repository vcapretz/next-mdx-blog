export default function BlogPost({ params }: { params: { slug: string } }) {
  return <div>BlogPost {params.slug}</div>;
}
