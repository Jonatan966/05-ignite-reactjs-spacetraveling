import { FC, useState } from 'react';
import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { Document } from '@prismicio/client/types/documents';

import { parseDate } from '../utils/parse-date';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

function parsePrismicPost(post: Document): Post {
  return {
    uid: post.uid,
    data: {
      title: post.data.title,
      author: post.data.author,
      subtitle: post.data.subtitle,
    },
    first_publication_date: parseDate(post.first_publication_date),
  };
}

export default function Home({
  postsPagination: { next_page, results },
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  const loadPostCard: FC<Post> = ({
    data: post,
    first_publication_date,
    uid,
  }) => (
    <a href={`/post/${uid}`} className={styles.postCard} key={uid}>
      <h2>{post.title}</h2>
      <p>{post.subtitle}</p>
      <div className={commonStyles.postDetails}>
        <span>
          <FiCalendar />
          {first_publication_date}
        </span>
        <span>
          <FiUser />
          {post.author}
        </span>
      </div>
    </a>
  );

  async function handleFetchPosts(): Promise<void> {
    const postsResponse = await fetch(nextPage);
    const fetchedPosts = (await postsResponse.json()) as ApiSearchResponse;

    const parsedPosts = fetchedPosts.results.map<Post>(parsePrismicPost);

    setPosts([...posts, ...parsedPosts]);
    setNextPage(fetchedPosts.next_page);
  }

  return (
    <main className={commonStyles.mainContainer}>
      <div>{posts.map(loadPostCard)}</div>

      {nextPage && (
        <button
          type="button"
          className={styles.loadMorePosts}
          onClick={handleFetchPosts}
        >
          Carregar mais posts
        </button>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  const parsedPosts = postsResponse.results.map<Post>(parsePrismicPost);

  return {
    props: {
      postsPagination: {
        results: parsedPosts,
        next_page: postsResponse.next_page,
      },
    },
  };
};
