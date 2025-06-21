import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../components/ui/avatar";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { ScrollArea } from "../../../../components/ui/scroll-area";

// Post data for mapping
const posts = [
  {
    id: 1,
    author: "Stuart",
    time: "25 mins",
    avatar: "/mask-group.png",
    title:
      "I need a CONTENT CREATOR that can help us create content for our socials. Shoes marketplace!",
    description:
      "There are some rooms in hidden corners of the venue, and I am unable to find room",
    tags: ["#Tech", "#AI", "#BuildInPublic"],
    upvotes: 6,
    meToo: 12,
    canHelp: 23,
    hasImage: false,
  },
  {
    id: 2,
    author: "Stuart",
    time: "25 mins",
    avatar: "/mask-group-1.png",
    title:
      "I need a CONTENT CREATOR that can help us create content for our socials. Shoes marketplace!",
    description:
      "There are some rooms in hidden corners of the venue, and I am unable to find room",
    tags: ["#Tech", "#AI", "#BuildInPublic"],
    upvotes: 6,
    meToo: 12,
    canHelp: 23,
    hasImage: true,
    image: "/screenshot-2025-06-12-at-15-35-51-1.png",
  },
  {
    id: 3,
    author: "Stuart",
    time: "25 mins",
    avatar: "/mask-group-2.png",
    title:
      "I need a CONTENT CREATOR that can help us create content for our socials. Shoes marketplace!",
    description:
      "There are some rooms in hidden corners of the venue, and I am unable to find room",
    tags: ["#Tech", "#AI", "#BuildInPublic"],
    upvotes: 6,
    meToo: 12,
    canHelp: 23,
    hasImage: false,
  },
];

export const ContentCreatorSection = (): JSX.Element => {
  return (
    <ScrollArea className="h-[690px] w-full py-2.5 px-2.5">
      <div className="flex flex-col gap-[15px]">
        {posts.map((post) => (
          <Card
            key={post.id}
            className="w-full bg-neutral-50 rounded-[20px] border-none"
          >
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar className="w-[35px] h-[35px]">
                    <AvatarImage
                      src={post.avatar}
                      alt={post.author}
                      className="object-cover"
                    />
                    <AvatarFallback>{post.author[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col">
                    <span className="font-text-name text-[#484848] text-[length:var(--text-name-font-size)] font-[number:var(--text-name-font-weight)]">
                      {post.author}
                    </span>
                    <span className="font-text-medium text-[#ababab] text-[length:var(--text-medium-font-size)] font-[number:var(--text-medium-font-weight)]">
                      {post.time}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <img className="w-6 h-6" alt="Bookmark" src="/bookmark.svg" />
                  <img
                    className="w-6 h-6"
                    alt="More options"
                    src="/more-vertical.svg"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="space-y-[5px]">
                  <h2 className="font-h2-question font-[number:var(--h2-question-font-weight)] text-black text-[length:var(--h2-question-font-size)] tracking-[var(--h2-question-letter-spacing)]">
                    {post.title}
                  </h2>
                  <p className="font-text-main font-[number:var(--text-main-font-weight)] text-black text-[length:var(--text-main-font-size)] tracking-[var(--text-main-letter-spacing)] leading-[var(--text-main-line-height)]">
                    {post.description}
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  {post.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-transparent border-0 p-0 font-text-medium font-[number:var(--text-medium-font-weight)] text-[#5b5b5b] text-[length:var(--text-medium-font-size)]"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                {post.hasImage && (
                  <div className="relative h-[100px] w-full rounded-[8px_8px_0px_0px] overflow-hidden">
                    <img
                      className="w-full h-[193px] object-cover"
                      alt="Screenshot"
                      src={post.image}
                    />
                    <div className="w-full h-3.5 absolute bottom-0 bg-[linear-gradient(180deg,rgba(251,251,251,1)_0%,rgba(251,251,251,0)_100%)] rotate-180" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  className="h-[38px] px-2.5 py-[5px] rounded-[25px] border-2 border-[#f0efeb] bg-transparent"
                >
                  <img
                    className="w-5 h-5 mr-2.5"
                    alt="Arrow up"
                    src="/arrow-up.svg"
                  />
                  <span className="font-medium text-black text-sm">
                    {post.upvotes}
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="h-[38px] px-2.5 py-[5px] rounded-[25px] bg-white shadow-[0px_2px_4px_#0000001a] border-0"
                >
                  <div className="flex items-center justify-center w-5 h-5 mr-[5px]">
                    <img
                      className="w-[25.4px] h-[25.4px]"
                      alt="Raised hand"
                      src="/11996-raised-hand-icon-1-2.png"
                    />
                  </div>
                  <span className="font-normal text-black text-sm mr-1">
                    Me too
                  </span>
                  <span className="font-medium text-black text-sm">
                    {post.meToo}
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="h-[38px] px-2.5 py-[5px] rounded-[25px] bg-white shadow-[0px_2px_4px_#0000001a] border-0"
                >
                  <div className="flex items-center mr-1">
                    <div className="relative w-[23.44px] h-[19.15px] overflow-hidden">
                      <div className="relative w-[23px] h-[18px] top-px">
                        <img
                          className="absolute w-[23px] h-4 top-0.5 left-0"
                          alt="Group"
                          src={`/group-3${post.id === 1 ? "" : `-${post.id - 1}`}.png`}
                        />
                        <img
                          className="absolute w-2.5 h-2 top-0 left-[11px]"
                          alt="Vector"
                          src="/vector-1.svg"
                        />
                        <img
                          className="absolute w-2.5 h-2 top-0 left-[11px]"
                          alt="Vector"
                          src="/vector.svg"
                        />
                      </div>
                    </div>
                  </div>
                  <span className="font-normal text-black text-sm mr-1">
                    I can help
                  </span>
                  <span className="font-medium text-black text-sm">
                    {post.canHelp}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};
