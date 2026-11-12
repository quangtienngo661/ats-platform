# PostgreSQL with pgvector, built on the SAME Alpine image the project already runs.
#
# The official pgvector/pgvector images for PostgreSQL 18 exist (pg18, 0.8.1-pg18) but only on Debian.
# Existing development volumes were created on Alpine (musl); mounting them under a glibc image changes how
# `en_US.utf8` text is collated, which can leave existing text indexes (for example users.email) out of order.
# Building the extension here keeps the libc, so only the extension is new.
FROM postgres:18.4-alpine

ARG PGVECTOR_VERSION=v0.8.1

# OPTFLAGS="" drops -march=native so the image runs on any x86-64 host, not only the one that built it.
# with_llvm=no skips the JIT bitcode, which needs clang and is not wanted for a plain extension.
RUN apk add --no-cache --virtual .pgvector-build-deps build-base git \
    && git clone --branch "${PGVECTOR_VERSION}" --depth 1 https://github.com/pgvector/pgvector.git /tmp/pgvector \
    && make -C /tmp/pgvector OPTFLAGS="" with_llvm=no \
    && make -C /tmp/pgvector OPTFLAGS="" with_llvm=no install \
    && rm -rf /tmp/pgvector \
    && apk del .pgvector-build-deps
