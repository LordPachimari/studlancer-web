import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  FormControl,
  FormErrorMessage,
  Heading,
  Input,
} from "@chakra-ui/react";
import { useClerk } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/api";
import { Field, Form, Formik, FormikProps } from "formik";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useState } from "react";
import { z } from "zod";
import { trpc } from "~/utils/api";
const UsernameFormValues = z.object({
  username: z.string().min(2, { message: "username is too short" }),
});
type UsernameFormValuesType = z.infer<typeof UsernameFormValues>;
export default function Username({}: // componentName,
// setComponentName,
{
  componentName: "USERNAME" | "CHARACTER";
  setComponentName: Dispatch<SetStateAction<"USERNAME" | "CHARACTER">>;
}) {
  const router = useRouter();
  function validateUsername(value: string) {
    let error;
    const usernameParseResult = UsernameFormValues.safeParse({
      username: value,
    });
    if (!value) {
      error = "Name is required";
    } else if (!usernameParseResult.success) {
      error = usernameParseResult.error.issues[0]?.message || "Invalid input";
    }
    return error;
  }
  const createUser = trpc.user.createUser.useMutation();

  return (
    <Formik
      initialValues={{ username: "" }}
      onSubmit={(values, actions) => {
        createUser.mutate(
          { username: values.username },
          {
            onSuccess: (data) => {
              if (data) {
                router
                  .push(`/profile/${data}`)
                  .catch((err) => console.log(err));
              }
            },
            onError: (error) => {
              actions.setErrors({ username: error.message });
            },
          }
        );
      }}
    >
      {(props) => (
        <Form>
          {" "}
          <Card
            bg="white"
            w={{ base: "100%", sm: "md" }}
            h="sm"
            borderRadius="3xl"
          >
            <CardHeader display="flex" justifyContent="center">
              <Heading size={{ base: "md" }}>USERNAME</Heading>
            </CardHeader>
            <CardBody>
              <Field name="username" validate={validateUsername}>
                {({
                  field,
                  form,
                }: {
                  field: typeof Field;
                  form: FormikProps<UsernameFormValuesType>;
                }) => (
                  <FormControl
                    isInvalid={!!form.errors.username && form.touched.username}
                  >
                    <Input {...field} placeholder="Enter Username" />
                    <FormErrorMessage>{form.errors.username}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
            </CardBody>
            <CardFooter justify="center">
              <Button
                mt={4}
                colorScheme="blue"
                isLoading={createUser.isLoading}
                type="submit"
                // onClick={() => setComponentName("CHARACTER")}
              >
                Next
              </Button>
            </CardFooter>
          </Card>
        </Form>
      )}
    </Formik>
  );
}
