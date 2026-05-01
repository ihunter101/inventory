import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  }).onUploadComplete(async ({ file }) => {
    console.log("uploaded image URL: ", file.ufsUrl);
  }),

  expenseInvoiceUploader: f({
    pdf: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  }).onUploadComplete(async ({ file }) => {
    console.log("uploaded invoice PDF URL: ", file.ufsUrl);

    return {
      uploadThingKey: file.key,
      fileUrl: file.ufsUrl,
      fileName: file.name,
      sizeBytes: file.size,
    };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;