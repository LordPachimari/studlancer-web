import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const s3Client = new S3Client({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY!,
      secretAccessKey: process.env.SECRET_KEY!,
    },
  });
  try {
    const post = await createPresignedPost(s3Client, {
      Bucket: process.env.PUBLIC_BUCKET_NAME!,
      Key: `images/${req.query.file}`,
      Fields: {
        // acl: "public-read",
        "Content-Type": req.query.fileType as string,
      },
      Expires: 600, // seconds
      Conditions: [
        ["content-length-range", 0, 10048576], // up to 10 MB
      ],
    });

    res.status(200).json(post);
  } catch (error) {
    console.log(error);
    res.status(500);
  }
}
