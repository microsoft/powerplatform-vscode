/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { MemFS } from "./FileSystemProvider";

export const CreateDemoSite = (fileSystem: MemFS) => {
    fileSystem.createDirectory(vscode.Uri.parse(`memfs:/src/`));

    fileSystem.createDirectory(vscode.Uri.parse(`memfs:/node_modules/`));

    fileSystem.writeFile(vscode.Uri.parse(`memfs:/src/index.tsx`), Buffer.from(`
import React from 'react';
import ReactDOM from 'react-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

const validationSchema = yup.object({
    email: yup
        .string('Enter your email')
        .email('Enter a valid email!')
        .required('Email is required'),
    password: yup
        .string('Enter your password')
        .min(8, 'Password should be of minimum 8 characters length')
        .required('Password is required'),
});

const WithMaterialUI = () => {
    const formik = useFormik({
        initialValues: {
            email: 'foobar@example.com',
            password: 'foobar',
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            alert(JSON.stringify(values, null, 2));
        },
    });

    return (
        <div>
            <form onSubmit={formik.handleSubmit}>
                <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                />
                <TextField
                    fullWidth
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                />
                <Button color="primary" variant="contained" fullWidth type="submit">
                    Submit
                </Button>
            </form>
        </div>
    );
};

ReactDOM.render(<WithMaterialUI />, document.getElementById('root'));
`.trim()
        ), { create: true, overwrite: true });

        fileSystem.writeFile(vscode.Uri.parse(`memfs:/package.json`), Buffer.from(
            JSON.stringify(
                {
                  dependencies: {
                    '@material-ui/core': '4.11.0',
                    formik: '2.3.0',
                    react: '18.2.0',
                    'react-dom': '18.2.0',
                    yup: '0.29.3',
                  },
                },
                null,
                2
              )
        ), { create: true, overwrite: true });

        fileSystem.writeFile(vscode.Uri.parse(`memfs:/esbuild.config.json`), Buffer.from(
            JSON.stringify(
                {
                  entryPoints: ['/src/index'],
                  outdir: '/dist',
                  format: 'esm',
                  write: false,
                  bundle: true,
                  plugins: [],
                },
                null,
                2
              )
        ), { create: true, overwrite: true });
};
