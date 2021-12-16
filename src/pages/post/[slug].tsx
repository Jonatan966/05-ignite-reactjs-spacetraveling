/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import Image from 'next/image';

import { FiCalendar, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { parseDate } from '../../utils/parse-date';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

type PageRoute = {
  slug: string;
};

export default function Post({
  post: { data: post, first_publication_date },
}: PostProps): JSX.Element {
  return (
    <>
      <div className={styles.postImage}>
        <Image layout="fill" src={post.banner.url} objectFit="cover" />
      </div>
      <article className={commonStyles.mainContainer}>
        <h1 className={styles.postTitle}>{post.title}</h1>
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

        {post.content.map(postContent => (
          <section className={styles.postSection}>
            <h2>{postContent.heading}</h2>
            <div
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(postContent.body),
              }}
            />
          </section>
        ))}
      </article>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      pageSize: 10,
      fetch: ['posts.title'],
    }
  );

  const mappedPosts = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    fallback: 'blocking',
    paths: mappedPosts,
  };
};

export const getStaticProps: GetStaticProps<
  PostProps,
  PageRoute
> = async context => {
  const prismic = getPrismicClient();
  const { data: post, first_publication_date } = await prismic.getByUID(
    'posts',
    String(context.params.slug),
    {
      fetch: ['posts.title', 'posts.banner', 'posts.author', 'posts.content'],
    }
  );

  const parsedPost: Post = {
    data: post,
    first_publication_date: parseDate(first_publication_date),
  };

  return {
    props: {
      post: parsedPost,
    },
    revalidate: 60 * 60 * 12, // 12 hours
  };
};
