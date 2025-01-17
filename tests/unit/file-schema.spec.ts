import { expectType } from "tsd";
import { z } from "zod";
import { getMeta } from "../../src/metadata";
import { ez } from "../../src";
import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";

describe("ez.file()", () => {
  describe("creation", () => {
    test("should create an instance being string by default", () => {
      const schema = ez.file();
      expect(schema).toBeInstanceOf(z.ZodString);
      expect(getMeta(schema, "kind")).toBe("File");
    });

    test.each([ez.file("string"), ez.file().string("deprecated message")])(
      "should create a string file",
      (schema) => {
        expect(schema).toBeInstanceOf(z.ZodString);
        expectType<string>(schema._output);
      },
    );

    test.each([ez.file("buffer"), ez.file().buffer("deprecated message")])(
      "should create a buffer file",
      (schema) => {
        expect(schema).toBeInstanceOf(z.ZodEffects);
        expectType<Buffer>(schema._output);
      },
    );

    test.each([ez.file("binary"), ez.file().binary("deprecated message")])(
      "should create a binary file",
      (schema) => {
        expect(schema).toBeInstanceOf(z.ZodUnion);
        expectType<Buffer | string>(schema._output);
      },
    );

    test.each([ez.file("base64"), ez.file().base64("deprecated message")])(
      "should create a base64 file",
      (schema) => {
        expect(schema).toBeInstanceOf(z.ZodString);
        expectType<string>(schema._output);
      },
    );
  });

  describe("parsing", () => {
    test.each([
      {
        schema: ez.file(),
        subject: 123,
        code: "invalid_type",
        expected: "string",
        received: "number",
        message: "Expected string, received number",
      },
      {
        schema: ez.file("buffer"),
        subject: "123",
        code: "custom",
        message: "Expected Buffer",
        fatal: true,
      },
    ])(
      "should invalidate wrong types",
      ({ schema, subject, ...expectedError }) => {
        const result = schema.safeParse(subject);
        expect(result.success).toBeFalsy();
        if (!result.success) {
          expect(result.error.issues).toEqual([
            {
              ...expectedError,
              path: [],
            },
          ]);
        }
      },
    );

    test("should perform additional check for base64 file", () => {
      const schema = ez.file("base64");
      const result = schema.safeParse("~~~~");
      expect(result.success).toBeFalsy();
      if (!result.success) {
        expect(result.error.issues).toEqual([
          {
            code: "invalid_string",
            message: "Does not match base64 encoding",
            validation: "regex",
            path: [],
          },
        ]);
      }
    });

    test("should accept string", () => {
      const schema = ez.file();
      const result = schema.safeParse("some string");
      expect(result).toEqual({
        success: true,
        data: "some string",
      });
    });

    test("should accept Buffer", () => {
      const schema = ez.file("buffer");
      const subject = Buffer.from("test", "utf-8");
      const result = schema.safeParse(subject);
      expect(result).toEqual({
        success: true,
        data: subject,
      });
    });

    test("should accept binary read string", async () => {
      const schema = ez.file("binary");
      const data = await readFile("logo.svg", "binary");
      const result = schema.safeParse(data);
      expect(result).toEqual({
        success: true,
        data,
      });
    });

    test("should accept base64 read string", async () => {
      const schema = ez.file("base64");
      const data = await readFile("logo.svg", "base64");
      const result = schema.safeParse(data);
      expect(result).toEqual({
        success: true,
        data,
      });
    });
  });
});
