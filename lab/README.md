# Common Centers Lab

Open **common_centers_lab.html** in a browser. It is a single offline file:
no installation, server, external scripts, or network requests are needed.
If a document preview does not execute scripts, download the file and open it
locally in Chrome, Firefox, or Safari.

Read **common_centers_applications.pdf** for a summary of the paper, applications,
display conventions, and a walkthrough. The editable LaTeX source is included.

## Three interactive projects

1. **Center pairs** — d=3,4,5. Move the two Gale parameters; rotate the scroll
   views; follow either contraction family; compute a matching projectivity;
   export full coordinates and the numerical matching residual.
2. **Blow-up microscope** — inspect each exceptional direction, its two
   excluded endpoints, and convergence of nearby pairs to the resolved limit.
   Click a boundary incidence cell to inspect the corresponding pair.
3. **Algebra & degree** — d=3,…,10 for Hilbert and normalization Betti formulas.
   Compare the coordinate ring with all sections. Inspect two exact rational
   hyperplane-section examples, with degree and real-root certificates.

## Reproducible computational projects

**common_centers_experiments.ipynb** contains six executed cells and figures.
Use it from this extracted folder so its Python imports resolve.

- `geometry.py`: kernel configurations, cleared coordinate formulas,
  exceptional limits, quotient cameras, matching checks.
- `algebra.py`: exact integer Hilbert and normalization Betti formulas.
- `slice_exact.py`: exact rational elimination, removal of the base factors,
  polynomial gcds, squarefreeness and Sturm real-root counts; approximate roots
  are used only for drawing their locations.
- `gale_signature.py`: 2d marked projective invariants and exact verification
  under two independent projective changes of coordinates.
- `engine.js`: the browser's independent numerical implementation.
- `ui.js` and `index.template.html`: editable interface sources.
- `make_figures.py`: static PNG and SVG research figures.

Rebuild from this folder with Python 3.10 or later:

```sh
python3 -m pip install -r requirements.txt
python3 run_all.py
python3 make_figures.py
python3 build_notebook.py
node test_engine.js
node test_ui.js
```

Node is optional and needed only for the UI handler smoke test. A Jupyter
installation is needed to edit and rerun the notebook interactively.

## What is exact and what is visual

The real geometry examples use the fixed Gale lists in `geometry.py`. Both
interpolation matrices have maximal rank over Q in all required degrees
(`interpolation_checks.json`). The coordinate matrices used by the viewer
are orthonormal row-space bases; the slice certificates use integer bases.
They describe projectively equivalent configurations, with different
coordinate hyperplanes.

The scroll clouds show bounded affine windows. For d>3 they are linear 3D
shadows of higher-dimensional affine charts; crossings in the picture can
be projection artifacts. No figure displays the whole complex surface.

The circle in the microscope represents the real exceptional curve RP1.
Its complexification is CP1. The paper's Euler characteristic is for the
complex valid surface and should not be read off the real drawing.

The full Betti table belongs to the normalization B as a module over the
original polynomial ring. The original ring R's full mixed Betti table is
not claimed to be computed.

## Recorded validation

- Python tests include ordinary pairs, every exceptional curve, both
  contraction families, and convergence to the resolved limit.
- 219 JavaScript camera-matching cases: largest relative residual
  2.21e-14 (`browser_math_checks.json`).
- 133 actual UI-handler state checks in a DOM/canvas stand-in, including
  endpoint classification, boundary navigation, and all dimension controls.
  A full browser layout test was not possible because this environment
  lacked a browser executable. Static figures and the guide PDF were
  rendered and visually inspected.
- Exact Hilbert/Betti arithmetic is checked for d=3,…,10 by reconstructing
  section dimensions from the alternating free-module sum.
- Rational slice certificates: d=3 gives 11 distinct complex pairs (9 real);
  d=4 gives 19 distinct complex pairs (9 real). Base factors are removed;
  squarefreeness and all needed denominator/base coprimalities are checked.
- Six notebook code cells executed successfully; outputs are included.

Numerical checks validate the implementations. They are separate from the
proofs in the research manuscript. The exact slice counts concern the
specific hyperplanes stored in the certificates, not all real inputs.

## Application directions

The paper provides an exact ambiguity family, a way to reduce constrained
center problems to finite candidate sets, a marked projective signature,
and a structured benchmark for elimination and continuation algorithms.
For d=3, the center hyperplanes are ordinary projective planes. Calibration,
positive depth, visibility, and Euclidean pose require additional conditions.

Good next research projects are tracking the constrained solutions as the
hyperplanes vary, finding their discriminant and real-root chambers, and
computing the unresolved mixed Tor-map ranks for R.

## Primary references

- [Ottaviani–Thomas, common pinhole-camera images](https://arxiv.org/abs/2603.14172).
- [Eisenbud–Popescu, The Projective Geometry of the Gale Transform](https://arxiv.org/abs/math/9807127).
- [Hartley–Zisserman, Multiple View Geometry](https://www.robots.ox.ac.uk/~vgg/hzbook/).
- [Macaulay2 multigraded Betti documentation](https://macaulay2.com/doc/Macaulay2/share/doc/Macaulay2/Macaulay2Doc/html/___Multigraded__Betti__Tally.html).
- [HomotopyContinuation.jl parameter homotopies](https://www.juliahomotopycontinuation.org/guides/parameter-homotopies/).

The mathematical formulas refer to the revised manuscript delivered in this
conversation. This package is its computational companion.

The guide source is `common_centers_applications.tex`. Compile it with pdfLaTeX
twice from this folder; its two PNG figures are included.
