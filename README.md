# Run App
From the root directory of the app (i.e., `wolfram-embedder-lab/`):
```
npm run app
```


# To View Notebook (Configurable Settings)
Navigate to `http://localhost:3000/`, specify a public Wolfram Cloud notebook by its UUID, set your options, and hit "Render". Note that if neither server-side rendering (SSR) nor client-side rendering (CSR) are enabled, then the notebook won't be rendered.


# To View Notebooks (SSR vs SSR + CSR)
Navigate to `http://localhost:3000/basic/` to see a notebook that's been included by default.

Navigate to `http://localhost:3000/basic/{uuid}` where `{uuid}` is the UUID of a public Wolfram Cloud notebook.
* Example: `http://localhost:3000/basic/a70939f9-cd26-42b9-a6db-c56c7c3ea58d`.