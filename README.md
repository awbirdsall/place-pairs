# Place pairs

Exploring an idle thought: how far are pairs of places from each other? How far are Parma, Ohio, and Milan, Ohio, from each other compared to Parma and Milan in Italy?

## Data

- `ohio_abroad.csv`: hand-curated list of place names in Ohio and their corresponding namesake location abroad. The intent is to only include towns or communities that are directly named after places outside the United States. This should *not* include towns whose direct namesake is a place in the United States (e.g. Lancaster or Geneva).
- `ohio_abroad_locs.csv`: above list annotated with coordinates based on querying the Open Street Map nominatim API. This lookup is performed in `nb/pair_distances.ipynb`.

## Notebook

This project uses `poetry` and `pyenv` to manage the Python environment (3.9.6).

```bash
pyenv install 3.9.6
pyenv local 3.9.6
poetry install
poetry run jupyter lab
```

The notebook includes the following:
- prepare updated `ohio_abroad_locs.csv` from `ohio_abroad.csv`
- generate `pairs.json` and `pairs_close.json` in nested format used by site
- characterizes the most extreme distances

## Front-end

The project includes a simple webpage that provides a quiz for each pair of locations: is the pair of Ohio locations or abroad locations closer?

The page is containerized to run locally:

```bash
docker-compose up
```

The contents of `app/site/` can be deployed as a static site, e.g. even just out of an S3 bucket.
