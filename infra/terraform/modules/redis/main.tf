variable "cluster_id" { type = string }
variable "node_type" { type = string }
variable "vpc_id" { type = string }
variable "subnet_ids" { type = list(string) }
variable "allowed_sg_ids" { type = list(string) }

resource "aws_security_group" "redis" {
  name   = "${var.cluster_id}-redis"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = var.allowed_sg_ids
  }
}

resource "aws_elasticache_subnet_group" "this" {
  name       = var.cluster_id
  subnet_ids = var.subnet_ids
}

resource "aws_elasticache_replication_group" "this" {
  replication_group_id       = var.cluster_id
  description                = "HRMS Redis cluster"
  node_type                  = var.node_type
  num_cache_clusters         = 2
  engine_version             = "7.2"
  parameter_group_name       = "default.redis7"
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.this.name
  security_group_ids         = [aws_security_group.redis.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  automatic_failover_enabled = true
}

output "primary_endpoint" {
  value = aws_elasticache_replication_group.this.primary_endpoint_address
}
output "reader_endpoint" {
  value = aws_elasticache_replication_group.this.reader_endpoint_address
}
