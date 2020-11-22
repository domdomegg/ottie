# Installation instructions (or at least what I did on Ubuntu 20.04):
#   sudo apt install texlive-latex-extra
#   sudo apt install texlive-bibtex-extra
#   npm install -g gdoc2latex

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 path/to/source"
    echo "This should be where the Google Docs HTML source is, without the .html extension"
    exit 1
fi

if [ "$1" == *.html ]; then
    echo "The path should not include the .html extension"
    exit 1
fi

if [ -d "$1" ]; then
    echo "The path should not be a directory"
    exit 1
fi

if ! [ -x "$(command -v gdoc2latex)" ]; then
    echo "Error: gdoc2latex is not installed"
    exit 1
fi

if ! [ -x "$(command -v pdflatex)" ]; then
    echo "pdflatex is not installed"
    exit 1
fi

if ! [ -x "$(command -v bibtex)" ]; then
    echo "Error: bibtex is not installed"
    exit 1
fi

# Clean old stuff
rm -f $1.aux $1.bbl $1.blg $1.dvi $1.log $1.pdf $1.toc $1.out $1.tex $1.bib

gdoc2latex --input $1.html --output $1.tex

# Use cd as pdflatex and bibtex constantly amaze me at how they are so inconsistent at which directory they use
cd $(dirname $1)

# This is done as one chained command so if an early step fails the entire thing fails
# You may question why we run latex three times? Nobody knows.
# Serious answer: https://tex.stackexchange.com/a/53236
pdflatex -interaction=nonstopmode $(basename $1) \
&& bibtex $(basename $1) \
&& pdflatex -interaction=nonstopmode $(basename $1) \
&& pdflatex -interaction=nonstopmode $(basename $1)