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
import {
  Field,
  FieldProps,
  Form,
  Formik,
  FormikProps,
  FormikValues,
} from "formik";
import { Dispatch, SetStateAction, useState } from "react";
import { z } from "zod";
const UsernameFormValues = z.object({
  username: z.string().min(2, { message: "username is too short" }),
});
type UsernameFormValuesType = z.infer<typeof UsernameFormValues>;
export default function Username({
  componentName,
  setComponentName,
}: {
  componentName: "USERNAME" | "CHARACTER";
  setComponentName: Dispatch<SetStateAction<"USERNAME" | "CHARACTER">>;
}) {
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

  return (
    <Formik
      initialValues={{ username: "" }}
      onSubmit={(values, actions) => {
        setTimeout(() => {
          alert(JSON.stringify(values, null, 2));
          actions.setSubmitting(false);
        }, 1000);
      }}
    >
      {(props) => (
        <Form>
          <Card bg="white" w="md" h="sm" borderRadius="3xl">
            <CardHeader display="flex" justifyContent="center">
              <Heading size={{ base: "md" }}>USERNAME</Heading>
            </CardHeader>
            <CardBody>
              <Field name="name" validate={validateUsername}>
                {({ field, form }) => (
                  <FormControl
                    isInvalid={form.errors.name && form.touched.name}
                  >
                    <Input {...field} placeholder="Enter Username" />
                    <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
            </CardBody>
            <CardFooter justify="center">
              <Button
                mt={4}
                colorScheme="blue"
                isLoading={props.isSubmitting}
                type="submit"
                onClick={() => setComponentName("CHARACTER")}
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
