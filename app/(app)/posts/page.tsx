import { PostList } from "@/components/editor/post-list";
import { PageHeader } from "@/components/ui/page-header";

export default function PostsPage() {
  return (
    <>
      <PageHeader title="Posts" description="Every post for this business. Open one to edit its design, caption and schedule." />
      <PostList />
    </>
  );
}
