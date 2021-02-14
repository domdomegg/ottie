# Installation instructions (or at least what I did on Ubuntu 20.04):
#   sudo apt install texlive-latex-extra
#   sudo apt install texlive-bibtex-extra
#   npm install -g gdoc2latex@3.0.3

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
f=index

# Use cd as pdflatex and bibtex constantly amaze me at how they are so inconsistent at which directory they use
cd $DIR

# Clean old stuff
rm -f $f.aux $f.bbl $f.blg $f.dvi $f.log $f.pdf $f.toc $f.out $f.tex $f.bib

gdoc2latex --input $f.html --output $f.tex --template-start start.tex --template-end end.tex

# This is done as one chained command so if an early step fails the entire thing fails
# You may question why we run latex three times? Nobody knows.
# Serious answer: https://tex.stackexchange.com/a/53236
pdflatex --shell-escape -interaction=nonstopmode $f
bibtex $f
pdflatex --shell-escape -interaction=nonstopmode $f
pdflatex --shell-escape -interaction=nonstopmode $f
